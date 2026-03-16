<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-64 flex-shrink-0">
    <!-- New Chat button -->
    <div class="p-3 border-b border-gray-200 dark:border-gray-700">
      <button
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        @click="emit('new-thread')"
      >
        <PlusIcon class="w-4 h-4" />
        Yeni Sohbet
      </button>
    </div>

    <!-- Thread list -->
    <div class="flex-1 overflow-y-auto py-2">
      <div
        v-for="thread in threads"
        :key="thread.thread_id"
        :class="[
          'group relative flex items-center gap-2 mx-2 mb-1 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-sm',
          thread.thread_id === activeThreadId
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
        ]"
        @click="emit('select-thread', thread.thread_id)"
      >
        <ChatBubbleLeftIcon class="w-4 h-4 flex-shrink-0 opacity-60" />
        <span class="flex-1 truncate">{{ thread.title || 'Sohbet' }}</span>
        <span v-if="thread.updated_at" class="text-xs opacity-50 flex-shrink-0 group-hover:hidden">
          {{ formatDate(thread.updated_at) }}
        </span>
        <button
          class="hidden group-hover:flex items-center justify-center w-5 h-5 rounded hover:text-red-500 transition-colors flex-shrink-0"
          @click.stop="emit('delete-thread', thread.thread_id)"
        >
          <TrashIcon class="w-3.5 h-3.5" />
        </button>
      </div>

      <p v-if="threads.length === 0" class="text-center text-gray-400 dark:text-gray-600 text-xs py-8">
        Henüz sohbet yok
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, TrashIcon, ChatBubbleLeftIcon } from '@heroicons/vue/24/solid'
import type { Thread } from '../services/chatApi'

defineProps<{
  threads: Thread[]
  activeThreadId?: string
}>()

const emit = defineEmits<{
  'new-thread': []
  'select-thread': [threadId: string]
  'delete-thread': [threadId: string]
}>()

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Dün'
    if (diffDays < 7) return `${diffDays}g`
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}
</script>
