<template>
  <div class="chat-sidebar">
    <!-- New Chat button -->
    <div class="chat-sidebar__header">
      <button class="chat-sidebar__new-btn" @click="emit('new-thread')">
        <PlusIcon class="w-4 h-4" />
        Yeni Sohbet
      </button>
    </div>

    <!-- Thread list -->
    <div class="chat-sidebar__list">
      <div
        v-for="thread in threads"
        :key="thread.thread_id"
        :class="['chat-sidebar__thread', { 'chat-sidebar__thread--active': thread.thread_id === activeThreadId }]"
        @click="emit('select-thread', thread.thread_id)"
      >
        <ChatBubbleLeftIcon class="w-4 h-4 flex-shrink-0 opacity-60" />
        <span class="chat-sidebar__thread-title">{{ thread.title || 'Sohbet' }}</span>
        <span v-if="thread.updated_at" class="chat-sidebar__thread-date">
          {{ formatDate(thread.updated_at) }}
        </span>
        <button
          class="chat-sidebar__thread-delete"
          @click.stop="emit('delete-thread', thread.thread_id)"
        >
          <TrashIcon class="w-3.5 h-3.5" />
        </button>
      </div>

      <p v-if="threads.length === 0" class="chat-sidebar__empty">
        Henüz sohbet yok
      </p>
    </div>

    <!-- Footer -->
    <div class="chat-sidebar__footer">
      <div class="chat-sidebar__brand">
        <div class="chat-sidebar__brand-icon">K</div>
        <span class="chat-sidebar__brand-name">Kingslanding</span>
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
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Dün'
    if (diffDays < 7) return `${diffDays}g`
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
  } catch { return '' }
}
</script>

<style scoped>
.chat-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: var(--sidebar-width, clamp(220px, 18vw, 320px));
  background: rgb(3 7 18);
  color: rgb(156 163 175);
  font-size: 0.875rem;
}

/* ── Header ── */
.chat-sidebar__header { padding: 0.75rem; }

.chat-sidebar__new-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(55 65 81);
  color: rgb(229 231 235);
  font-weight: 500;
  transition: all 200ms;
}
.chat-sidebar__new-btn:hover {
  background: rgb(31 41 55);
  border-color: rgb(75 85 99);
}

/* ── Thread list ── */
.chat-sidebar__list {
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem 0.5rem;
}

.chat-sidebar__thread {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 150ms;
  margin-bottom: 2px;
}
.chat-sidebar__thread:hover {
  background: rgba(31 41 55 / 0.6);
  color: rgb(229 231 235);
}
.chat-sidebar__thread--active {
  background: rgb(31 41 55);
  color: white;
}

.chat-sidebar__thread-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-sidebar__thread-date {
  flex-shrink: 0;
  font-size: 0.75rem;
  opacity: 0.4;
}
.chat-sidebar__thread:hover .chat-sidebar__thread-date { display: none; }

.chat-sidebar__thread-delete {
  display: none;
  flex-shrink: 0;
  padding: 0.25rem;
  border-radius: 0.375rem;
  color: rgb(107 114 128);
  transition: all 150ms;
}
.chat-sidebar__thread:hover .chat-sidebar__thread-delete { display: flex; }
.chat-sidebar__thread-delete:hover { color: rgb(248 113 113); background: rgb(55 65 81); }

.chat-sidebar__empty {
  text-align: center;
  color: rgb(75 85 99);
  font-size: 0.75rem;
  padding: 2rem 0;
}

/* ── Footer ── */
.chat-sidebar__footer {
  padding: 0.75rem;
  border-top: 1px solid rgb(31 41 55);
}

.chat-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
}

.chat-sidebar__brand-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgb(59 130 246), rgb(37 99 235));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.chat-sidebar__brand-name {
  color: rgb(209 213 219);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
