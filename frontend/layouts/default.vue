<script setup lang="ts">
const { user, isAuthenticated, logout } = useAuth()
const colorMode = useColorMode()

const navigation = [
  { label: 'Dashboard', icon: 'i-heroicons-squares-2x2', to: '/' },
  { label: 'Tasks', icon: 'i-heroicons-check-circle', to: '/tasks' },
  { label: 'Notes', icon: 'i-heroicons-document-text', to: '/notes' },
  { label: 'Financials', icon: 'i-heroicons-banknotes', to: '/financials' },
]

const isSidebarOpen = ref(false)
const route = useRoute()

// Close sidebar on route change (mobile)
watch(() => route.path, () => { isSidebarOpen.value = false })
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
    <!-- Sidebar overlay (mobile) -->
    <Transition name="fade">
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 z-20 bg-black/50 lg:hidden"
        @click="isSidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 dark:border-gray-800',
        'bg-white dark:bg-gray-900 transition-transform duration-300',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <!-- Logo -->
      <div class="flex h-16 items-center gap-3 px-6 border-b border-gray-200 dark:border-gray-800">
        <div class="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
          <UIcon name="i-heroicons-bolt" class="h-5 w-5 text-white" />
        </div>
        <span class="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          :class="route.path === item.to
            ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon :name="item.icon" class="h-5 w-5 flex-shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- User section -->
      <div class="border-t border-gray-200 dark:border-gray-800 p-4">
        <div class="flex items-center gap-3">
          <UAvatar
            :src="user?.avatarUrl || undefined"
            :alt="user?.name"
            size="sm"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ user?.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
          </div>
          <UButton
            icon="i-heroicons-arrow-right-on-rectangle"
            color="gray"
            variant="ghost"
            size="xs"
            aria-label="Logout"
            @click="logout"
          />
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex flex-1 flex-col overflow-hidden lg:ml-64">
      <!-- Top bar -->
      <header class="flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 lg:px-6">
        <UButton
          icon="i-heroicons-bars-3"
          color="gray"
          variant="ghost"
          class="lg:hidden"
          aria-label="Toggle sidebar"
          @click="isSidebarOpen = !isSidebarOpen"
        />

        <div class="flex-1" />

        <!-- Color mode toggle -->
        <UButton
          :icon="colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon'"
          color="gray"
          variant="ghost"
          size="sm"
          aria-label="Toggle color mode"
          @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
        />
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
