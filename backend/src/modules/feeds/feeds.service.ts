import axios from 'axios'
import { withCache } from '../../lib/redis.js'

const WEATHER_BASE = 'https://api.openweathermap.org/data/2.5'
const NEWS_BASE = 'https://newsapi.org/v2'

export const feedsService = {
  async getWeather(city: string) {
    const cacheKey = `weather:${city.toLowerCase()}`
    return withCache(cacheKey, 60 * 10, async () => {
      const { data } = await axios.get(`${WEATHER_BASE}/weather`, {
        params: {
          q: city,
          units: 'metric',
          appid: process.env.OPENWEATHER_API_KEY,
        },
      })
      return {
        city: data.name,
        country: data.sys.country,
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        wind: data.wind.speed,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
      }
    })
  },

  async getForecast(city: string) {
    const cacheKey = `forecast:${city.toLowerCase()}`
    return withCache(cacheKey, 60 * 30, async () => {
      const { data } = await axios.get(`${WEATHER_BASE}/forecast`, {
        params: {
          q: city,
          units: 'metric',
          cnt: 5,
          appid: process.env.OPENWEATHER_API_KEY,
        },
      })
      return data.list.map((item: any) => ({
        dt: item.dt,
        temp: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
      }))
    })
  },

  async getNews(query: string = 'technology', pageSize = 10) {
    const cacheKey = `news:${query}:${pageSize}`
    return withCache(cacheKey, 60 * 15, async () => {
      const { data } = await axios.get(`${NEWS_BASE}/top-headlines`, {
        params: {
          q: query,
          pageSize,
          language: 'en',
          apiKey: process.env.NEWS_API_KEY,
        },
      })
      return (data.articles ?? []).map((a: any) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        urlToImage: a.urlToImage,
        publishedAt: a.publishedAt,
        source: a.source.name,
      }))
    })
  },
}
