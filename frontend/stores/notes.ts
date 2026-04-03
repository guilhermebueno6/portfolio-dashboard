import { defineStore } from 'pinia'
import type { Note } from '~/types'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const loading = ref(false)
  const { $api } = useApi()

  const pinned = computed(() => notes.value.filter((n) => n.pinned))
  const unpinned = computed(() => notes.value.filter((n) => !n.pinned))

  async function fetchNotes(search?: string) {
    loading.value = true
    try {
      const params = search ? `?q=${encodeURIComponent(search)}` : ''
      const { notes: data } = await $api<{ notes: Note[] }>(`/api/notes${params}`)
      notes.value = data
    } finally {
      loading.value = false
    }
  }

  async function createNote(payload: Partial<Note>) {
    const { note } = await $api<{ note: Note }>('/api/notes', {
      method: 'POST',
      body: payload,
    })
    notes.value.unshift(note)
    return note
  }

  async function updateNote(id: string, payload: Partial<Note>) {
    const { note } = await $api<{ note: Note }>(`/api/notes/${id}`, {
      method: 'PATCH',
      body: payload,
    })
    const idx = notes.value.findIndex((n) => n.id === id)
    if (idx !== -1) notes.value[idx] = note
    return note
  }

  async function deleteNote(id: string) {
    await $api(`/api/notes/${id}`, { method: 'DELETE' })
    notes.value = notes.value.filter((n) => n.id !== id)
  }

  async function togglePin(id: string) {
    const note = notes.value.find((n) => n.id === id)
    if (!note) return
    return updateNote(id, { pinned: !note.pinned })
  }

  return { notes, loading, pinned, unpinned, fetchNotes, createNote, updateNote, deleteNote, togglePin }
})
