<template>
  <div class="flex flex-col h-full bg-gray-950 dark:bg-gray-950 w-64 flex-shrink-0">
    <!-- New Chat button -->
    <div class="p-3">
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 text-gray-200 text-sm font-medium transition-all duration-200 hover:border-gray-600"
        @click="emit('new-thread')"
      >
        <PlusIcon class="w-4 h-4" />
        Yeni Sohbet
      </button>
    </div>

    <!-- Thread list -->
    <div class="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
      <TransitionGroup name="thread-list">
        <div
          v-for="thread in threads"
          :key="thread.thread_id"
          :class="[
            'group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-sm',
            thread.thread_id === activeThreadId
              ? 'bg-gray-800 text-white'
              : 'hover:bg-gray-800/60 text-gray-400 hover:text-gray-200',
          ]"
          @click="emit('select-thread', thread.thread_id)"
        >
          <ChatBubbleLeftIcon class="w-4 h-4 flex-shrink-0 opacity-60" />
          <span class="flex-1 truncate">{{ thread.title || 'Sohbet' }}</span>
          <span
            v-if="thread.updated_at"
            class="text-xs opacity-40 flex-shrink-0 group-hover:hidden transition-opacity"
          >
            {{ formatDate(thread.updated_at) }}
          </span>
          <button
            class="hidden group-hover:flex items-center justify-center w-6 h-6 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-all flex-shrink-0"
            @click.stop="emit('delete-thread', thread.thread_id)"
          >
            <TrashIcon class="w-3.5 h-3.5" />
          </button>
        </div>
      </TransitionGroup>

      <p v-if="threads.length === 0" class="text-center text-gray-600 text-xs py-8">
        Henüz sohbet yok
      </p>
    </div>

    <!-- Footer -->
    <div class="p-3 border-t border-gray-800">
      <div class="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 text-sm">
        <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
          K
        </div>
        <span class="truncate text-gray-300">Kingslanding</span>
      </div>
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
