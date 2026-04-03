import { FastifyInstance } from 'fastify'
import oauth2 from '@fastify/oauth2'
import axios from 'axios'
import { authService } from './auth.service.js'
import { authenticate } from '../../middleware/authenticate.js'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Register Google OAuth2 plugin scoped to this plugin instance
  await app.register(oauth2, {
    name: 'googleOAuth2',
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID!,
        secret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      auth: oauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/google',
    callbackUri: process.env.GOOGLE_CALLBACK_URL!,
    pkce: 'S256',
  })

  // GET /api/auth/google — redirect to Google consent screen
  // (handled automatically by @fastify/oauth2 via startRedirectPath)

  // GET /api/auth/google/callback
  app.get('/google/callback', async (request, reply) => {
    try {
      // Exchange code for tokens
      const tokenResponse =
        await (app as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)

      const { token } = tokenResponse
      const { access_token, refresh_token, expires_at } = token

      // Fetch Google profile
      const { data: profile } = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        { headers: { Authorization: `Bearer ${access_token}` } },
      )

      const user = await authService.upsertGoogleUser(
        { id: profile.id, email: profile.email, name: profile.name, picture: profile.picture },
        { access_token, refresh_token, expiry_date: expires_at },
      )

      // Sign JWT
      const jwtToken = app.jwt.sign({ id: user.id, email: user.email })

      // Set cookie + redirect to frontend
      reply
        .setCookie('auth_token', jwtToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
        .redirect(process.env.FRONTEND_URL || 'http://localhost:3000')
    } catch (err) {
      app.log.error(err)
      reply.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`)
    }
  })

  // GET /api/auth/me — return current user
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    return reply.send({ user: (request as any).user })
  })

  // POST /api/auth/logout
  app.post('/logout', async (request, reply) => {
    reply.clearCookie('auth_token', { path: '/' })
    return reply.send({ success: true })
  })
}
