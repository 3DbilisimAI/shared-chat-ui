<template>
  <div class="chat-sidebar">
    <!-- Header: new chat + close -->
    <div class="chat-sidebar__header">
      <button class="chat-sidebar__new-btn" @click="emit('new-thread')">
        <PlusIcon class="w-4 h-4" />
        Yeni Sohbet
      </button>
      <button class="chat-sidebar__collapse-btn" @click="emit('close')" title="Menüyü kapat">
        <ChevronDoubleLeftIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Thread list -->
    <div class="chat-sidebar__list">
      <!-- Pinned section -->
      <template v-if="pinnedThreads.length > 0">
        <div class="chat-sidebar__group-label">
          <BookmarkIcon class="w-3 h-3" />
          Sabitlenmiş
        </div>
        <div
          v-for="thread in pinnedThreads"
          :key="'pin-' + thread.thread_id"
          :class="['chat-sidebar__thread', { 'chat-sidebar__thread--active': thread.thread_id === activeThreadId }]"
          @click="emit('select-thread', thread.thread_id)"
        >
          <ChatBubbleLeftIcon class="w-4 h-4 flex-shrink-0 opacity-60" />
          <span class="chat-sidebar__thread-title">{{ thread.title || 'Sohbet' }}</span>
          <div class="chat-sidebar__thread-actions">
            <button class="chat-sidebar__thread-action" @click.stop="togglePin(thread.thread_id)" title="Sabitlemeyi kaldır">
              <BookmarkSlashIcon class="w-3 h-3" />
            </button>
            <button class="chat-sidebar__thread-action" @click.stop="shareThread(thread.thread_id)" title="Paylaş">
              <ShareIcon class="w-3 h-3" />
            </button>
            <button class="chat-sidebar__thread-action chat-sidebar__thread-action--danger" @click.stop="emit('delete-thread', thread.thread_id)" title="Sil">
              <TrashIcon class="w-3 h-3" />
            </button>
          </div>
        </div>
      </template>

      <!-- Date groups -->
      <template v-for="group in dateGroups" :key="group.label">
        <template v-if="group.threads.length > 0">
          <div class="chat-sidebar__group-label">{{ group.label }}</div>
          <div
            v-for="thread in group.threads"
            :key="thread.thread_id"
            :class="['chat-sidebar__thread', { 'chat-sidebar__thread--active': thread.thread_id === activeThreadId }]"
            @click="emit('select-thread', thread.thread_id)"
          >
            <ChatBubbleLeftIcon class="w-4 h-4 flex-shrink-0 opacity-60" />
            <span class="chat-sidebar__thread-title">{{ thread.title || 'Sohbet' }}</span>
            <span v-if="thread.updated_at" class="chat-sidebar__thread-date">
              {{ formatTime(thread.updated_at) }}
            </span>
            <div class="chat-sidebar__thread-actions">
              <button class="chat-sidebar__thread-action" @click.stop="togglePin(thread.thread_id)" title="Sabitle">
                <BookmarkIcon class="w-3 h-3" />
              </button>
              <button class="chat-sidebar__thread-action" @click.stop="shareThread(thread.thread_id)" title="Paylaş">
                <ShareIcon class="w-3 h-3" />
              </button>
              <button class="chat-sidebar__thread-action chat-sidebar__thread-action--danger" @click.stop="emit('delete-thread', thread.thread_id)" title="Sil">
                <TrashIcon class="w-3 h-3" />
              </button>
            </div>
          </div>
        </template>
      </template>

      <p v-if="threads.length === 0" class="chat-sidebar__empty">
        Henüz sohbet yok
      </p>
    </div>

    <!-- Footer -->
    <div class="chat-sidebar__footer">
      <div class="chat-sidebar__brand">
        <div class="chat-sidebar__brand-icon">{{ brandInitial }}</div>
        <span class="chat-sidebar__brand-name">{{ brandName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { PlusIcon, TrashIcon, ChatBubbleLeftIcon, ChevronDoubleLeftIcon, ShareIcon, BookmarkIcon } from '@heroicons/vue/24/solid'
import { BookmarkSlashIcon } from '@heroicons/vue/24/outline'
import type { Thread } from '../services/chatApi'

const PINS_KEY = 'chat-pinned-threads'

const props = withDefaults(defineProps<{
  threads: Thread[]
  activeThreadId?: string
  brandName?: string
}>(), {
  brandName: 'Chat',
})

const emit = defineEmits<{
  'new-thread': []
  'select-thread': [threadId: string]
  'delete-thread': [threadId: string]
  'close': []
}>()

const pinnedIds = ref<Set<string>>(new Set())

onMounted(() => {
  try {
    const stored = localStorage.getItem(PINS_KEY)
    if (stored) pinnedIds.value = new Set(JSON.parse(stored))
  } catch { /* ignore */ }
})

function savePins() {
  localStorage.setItem(PINS_KEY, JSON.stringify([...pinnedIds.value]))
}

function togglePin(threadId: string) {
  if (pinnedIds.value.has(threadId)) {
    pinnedIds.value.delete(threadId)
  } else {
    pinnedIds.value.add(threadId)
  }
  pinnedIds.value = new Set(pinnedIds.value) // trigger reactivity
  savePins()
}

const brandInitial = computed(() => props.brandName.charAt(0).toUpperCase())

const pinnedThreads = computed(() =>
  props.threads.filter(t => pinnedIds.value.has(t.thread_id))
)

const unpinnedThreads = computed(() =>
  props.threads.filter(t => !pinnedIds.value.has(t.thread_id))
)

const dateGroups = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const week = new Date(today.getTime() - 7 * 86400000)

  const groups = [
    { label: 'Bugün', threads: [] as Thread[] },
    { label: 'Dün', threads: [] as Thread[] },
    { label: 'Son 7 gün', threads: [] as Thread[] },
    { label: 'Daha eski', threads: [] as Thread[] },
  ]

  for (const thread of unpinnedThreads.value) {
    const d = thread.updated_at ? new Date(thread.updated_at) : new Date(0)
    if (d >= today) groups[0].threads.push(thread)
    else if (d >= yesterday) groups[1].threads.push(thread)
    else if (d >= week) groups[2].threads.push(thread)
    else groups[3].threads.push(thread)
  }

  return groups
})

function shareThread(threadId: string) {
  const url = `${window.location.origin}/chat/${threadId}`
  navigator.clipboard.writeText(url).catch(() => {})
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}
</script>

<style scoped>
.chat-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid rgb(31 41 55);
  background: rgb(3 7 18);
  color: rgb(156 163 175);
  font-size: 0.875rem;
}

.chat-sidebar__header {
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chat-sidebar__new-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
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

.chat-sidebar__collapse-btn {
  padding: 0.375rem;
  border-radius: 0.5rem;
  color: rgb(107 114 128);
  transition: all 150ms;
  flex-shrink: 0;
}
.chat-sidebar__collapse-btn:hover {
  background: rgb(31 41 55);
  color: rgb(209 213 219);
}

/* ── Groups ── */
.chat-sidebar__group-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(107 114 128);
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
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 150ms;
  margin-bottom: 1px;
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

.chat-sidebar__thread-actions {
  display: none;
  align-items: center;
  gap: 0.125rem;
  flex-shrink: 0;
}
.chat-sidebar__thread:hover .chat-sidebar__thread-actions { display: flex; }

.chat-sidebar__thread-action {
  padding: 0.25rem;
  border-radius: 0.375rem;
  color: rgb(107 114 128);
  transition: all 150ms;
}
.chat-sidebar__thread-action:hover { color: rgb(209 213 219); background: rgb(55 65 81); }
.chat-sidebar__thread-action--danger:hover { color: rgb(248 113 113); }

.chat-sidebar__empty {
  text-align: center;
  color: rgb(75 85 99);
  font-size: 0.75rem;
  padding: 2rem 0;
}

/* ── Footer ── */
.chat-sidebar__footer {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid rgb(31 41 55);
}

.chat-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.chat-sidebar__brand-icon {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgb(59 130 246), rgb(37 99 235));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  flex-shrink: 0;
}

.chat-sidebar__brand-name {
  color: rgb(209 213 219);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
}
</style>
