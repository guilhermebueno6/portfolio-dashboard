<script setup lang="ts">
import type { Note } from '~/types'

definePageMeta({ middleware: 'auth' })

const notesStore = useNotesStore()
await notesStore.fetchNotes()

const search = ref('')
const debouncedSearch = useDebounce(search, 300)
watch(debouncedSearch, (q) => notesStore.fetchNotes(q || undefined))

const NOTE_COLORS = [
  '#ffffff', '#fef9c3', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#ffedd5',
]

const isCreateOpen = ref(false)
const editingNote = ref<Note | null>(null)
const noteForm = ref({ title: '', content: '', color: '#ffffff', pinned: false })

function openCreate() {
  editingNote.value = null
  noteForm.value = { title: '', content: '', color: '#ffffff', pinned: false }
  isCreateOpen.value = true
}

function openEdit(note: Note) {
  editingNote.value = note
  noteForm.value = { title: note.title, content: note.content, color: note.color, pinned: note.pinned }
  isCreateOpen.value = true
}

async function saveNote() {
  if (editingNote.value) {
    await notesStore.updateNote(editingNote.value.id, noteForm.value)
  } else {
    await notesStore.createNote(noteForm.value)
  }
  isCreateOpen.value = false
}
</script>

<template>
  <div class="p-4 lg:p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notes</h1>
      <UButton icon="i-heroicons-plus" @click="openCreate">New Note</UButton>
    </div>

    <UInput
      v-model="search"
      icon="i-heroicons-magnifying-glass"
      placeholder="Search notes..."
      class="mb-6 max-w-sm"
    />

    <!-- Pinned -->
    <template v-if="notesStore.pinned.length > 0">
      <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Pinned</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div
          v-for="note in notesStore.pinned"
          :key="note.id"
          class="group relative rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
          :style="{ backgroundColor: note.color }"
          @click="openEdit(note)"
        >
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold text-gray-900 text-sm">{{ note.title }}</h3>
            <div class="hidden group-hover:flex items-center gap-1">
              <UButton icon="i-heroicons-star-solid" size="2xs" color="yellow" variant="ghost" @click.stop="notesStore.togglePin(note.id)" />
              <UButton icon="i-heroicons-trash" size="2xs" color="red" variant="ghost" @click.stop="notesStore.deleteNote(note.id)" />
            </div>
          </div>
          <p class="text-xs text-gray-600 line-clamp-4 whitespace-pre-wrap">{{ note.content }}</p>
          <p class="text-xs text-gray-400 mt-3">{{ new Date(note.updatedAt).toLocaleDateString() }}</p>
        </div>
      </div>
    </template>

    <!-- All notes -->
    <template v-if="notesStore.unpinned.length > 0">
      <p v-if="notesStore.pinned.length > 0" class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Others</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="note in notesStore.unpinned"
          :key="note.id"
          class="group relative rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
          :style="{ backgroundColor: note.color }"
          @click="openEdit(note)"
        >
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold text-gray-900 text-sm">{{ note.title }}</h3>
            <div class="hidden group-hover:flex items-center gap-1">
              <UButton icon="i-heroicons-star" size="2xs" color="gray" variant="ghost" @click.stop="notesStore.togglePin(note.id)" />
              <UButton icon="i-heroicons-trash" size="2xs" color="red" variant="ghost" @click.stop="notesStore.deleteNote(note.id)" />
            </div>
          </div>
          <p class="text-xs text-gray-600 line-clamp-4 whitespace-pre-wrap">{{ note.content }}</p>
          <p class="text-xs text-gray-400 mt-3">{{ new Date(note.updatedAt).toLocaleDateString() }}</p>
        </div>
      </div>
    </template>

    <div v-if="notesStore.notes.length === 0" class="text-center py-16 text-gray-400">
      <UIcon name="i-heroicons-document-text" class="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p>No notes yet. Create your first one!</p>
    </div>

    <!-- Create / edit modal -->
    <UModal v-model="isCreateOpen" :ui="{ width: 'max-w-lg' }">
      <UCard :style="{ backgroundColor: noteForm.color }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">{{ editingNote ? 'Edit Note' : 'New Note' }}</h3>
            <!-- Color picker -->
            <div class="flex items-center gap-1">
              <button
                v-for="c in NOTE_COLORS"
                :key="c"
                class="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                :style="{ backgroundColor: c, borderColor: noteForm.color === c ? '#6366f1' : 'transparent' }"
                @click="noteForm.color = c"
              />
            </div>
          </div>
        </template>

        <div class="space-y-3">
          <UInput
            v-model="noteForm.title"
            placeholder="Title"
            class="font-semibold text-base"
            variant="none"
            autofocus
          />
          <UTextarea
            v-model="noteForm.content"
            placeholder="Start writing..."
            variant="none"
            :rows="8"
            class="resize-none"
          />
        </div>

        <template #footer>
          <div class="flex items-center justify-between">
            <UCheckbox v-model="noteForm.pinned" label="Pin note" />
            <div class="flex gap-3">
              <UButton color="gray" variant="ghost" @click="isCreateOpen = false">Cancel</UButton>
              <UButton @click="saveNote">Save</UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
