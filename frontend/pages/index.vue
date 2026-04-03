<script setup lang="ts">
import type { Weather, CalendarEvent, NewsArticle } from '~/types'

definePageMeta({ middleware: 'auth' })

const { user } = useAuth()
const tasksStore = useTasksStore()
const notesStore = useNotesStore()
const { $api } = useApi()

// Fetch all dashboard data in parallel
const [weather, events, articles] = await Promise.allSettled([
  $api<{ weather: Weather }>('/api/feeds/weather?city=Lisbon').then((r) => r.weather),
  $api<{ events: CalendarEvent[] }>('/api/calendar/events').then((r) => r.events),
  $api<{ articles: NewsArticle[] }>('/api/feeds/news?pageSize=5').then((r) => r.articles),
])

await Promise.all([
  tasksStore.fetchTasks(),
  notesStore.fetchNotes(),
])

const weatherData = weather.status === 'fulfilled' ? weather.value : null
const calendarEvents = events.status === 'fulfilled' ? events.value : []
const newsArticles = articles.status === 'fulfilled' ? articles.value : []

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

const upcomingTasks = computed(() =>
  tasksStore.tasks.filter((t) => t.status !== 'DONE' && t.status !== 'ARCHIVED').slice(0, 5),
)

const pinnedNotes = computed(() => notesStore.pinned.slice(0, 3))
</script>

<template>
  <div class="p-4 lg:p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ greeting }}, {{ user?.name?.split(' ')[0] }} 👋
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
        </p>
      </div>

      <!-- Weather -->
      <div v-if="weatherData" class="hidden sm:flex items-center gap-3 text-right">
        <div>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ weatherData.temp }}°C</p>
          <p class="text-xs text-gray-500 capitalize">{{ weatherData.description }}</p>
        </div>
        <img
          :src="`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`"
          :alt="weatherData.description"
          class="h-12 w-12"
        />
      </div>
    </div>

    <!-- Main grid -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Tasks widget -->
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-white">Upcoming Tasks</h2>
            <NuxtLink to="/tasks">
              <UButton variant="ghost" size="xs" trailing-icon="i-heroicons-arrow-right">View all</UButton>
            </NuxtLink>
          </div>
        </template>

        <div v-if="upcomingTasks.length === 0" class="text-center py-8 text-sm text-gray-500">
          No pending tasks — enjoy your day! ✨
        </div>

        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <li
            v-for="task in upcomingTasks"
            :key="task.id"
            class="flex items-center gap-3 py-3"
          >
            <UBadge
              :label="task.priority"
              :color="{ LOW: 'gray', MEDIUM: 'blue', HIGH: 'orange', URGENT: 'red' }[task.priority]"
              variant="subtle"
              size="xs"
            />
            <span class="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{{ task.title }}</span>
            <span v-if="task.dueDate" class="text-xs text-gray-400">
              {{ new Date(task.dueDate).toLocaleDateString() }}
            </span>
          </li>
        </ul>
      </UCard>

      <!-- Calendar widget -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-white">Calendar</h2>
          </div>
        </template>

        <div v-if="calendarEvents.length === 0" class="text-center py-6 text-sm text-gray-500">
          No upcoming events
        </div>

        <ul v-else class="space-y-2">
          <li
            v-for="event in calendarEvents.slice(0, 5)"
            :key="event.id"
            class="rounded-lg bg-primary-50 dark:bg-primary-500/10 p-3"
          >
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ event.summary }}</p>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ new Date(event.start.dateTime || event.start.date || '').toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
            </p>
          </li>
        </ul>
      </UCard>
    </div>

    <!-- Bottom row -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Pinned notes -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-white">Pinned Notes</h2>
            <NuxtLink to="/notes">
              <UButton variant="ghost" size="xs" trailing-icon="i-heroicons-arrow-right">View all</UButton>
            </NuxtLink>
          </div>
        </template>

        <div v-if="pinnedNotes.length === 0" class="text-center py-6 text-sm text-gray-500">
          Pin a note to see it here
        </div>

        <div class="grid grid-cols-1 gap-3">
          <div
            v-for="note in pinnedNotes"
            :key="note.id"
            class="rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            :style="{ backgroundColor: note.color === '#ffffff' ? undefined : note.color + '20' }"
          >
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ note.title }}</p>
            <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ note.content }}</p>
          </div>
        </div>
      </UCard>

      <!-- News -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-gray-900 dark:text-white">Latest News</h2>
        </template>

        <ul class="divide-y divide-gray-100 dark:divide-gray-800">
          <li v-for="article in newsArticles" :key="article.url" class="py-3">
            <a :href="article.url" target="_blank" rel="noopener" class="group">
              <p class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2">
                {{ article.title }}
              </p>
              <p class="text-xs text-gray-500 mt-1">{{ article.source }}</p>
            </a>
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>
