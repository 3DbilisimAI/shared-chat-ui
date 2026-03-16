<template>
  <div class="chat-input-wrap">
    <textarea
      ref="textareaRef"
      v-model="text"
      :disabled="disabled"
      rows="1"
      placeholder="Mesajınızı yazın..."
      class="chat-input-wrap__textarea"
      @keydown.enter.exact.prevent="send"
      @keydown.shift.enter="newline"
      @input="resize"
    />
    <button
      :disabled="disabled || !text.trim()"
      :class="['chat-input-wrap__send', { 'chat-input-wrap__send--active': text.trim() }]"
      @click="send"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ send: [message: string] }>()

const text = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function resize() {
  nextTick(() => {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  })
}

function newline() { /* browser default */ }

function send() {
  const msg = text.value.trim()
  if (!msg) return
  emit('send', msg)
  text.value = ''
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
}
</script>

<style scoped>
.chat-input-wrap {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  margin: 0.75rem;
  border-radius: 1rem;
  border: 1px solid rgb(229 231 235);
  background: rgb(249 250 251);
  transition: border-color 200ms;
}
.chat-input-wrap:focus-within {
  border-color: rgb(96 165 250);
}

:root.dark .chat-input-wrap {
  border-color: rgb(75 85 99);
  background: rgb(31 41 55);
}
:root.dark .chat-input-wrap:focus-within {
  border-color: rgb(59 130 246);
}

.chat-input-wrap__textarea {
  flex: 1;
  min-width: 0;
  resize: none;
  background: transparent;
  border: none;
  outline: none;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgb(17 24 39);
  max-height: 25vh;           /* ← percentage of viewport, not px */
  overflow-y: auto;
}
:root.dark .chat-input-wrap__textarea { color: rgb(243 244 246); }
.chat-input-wrap__textarea::placeholder { color: rgb(156 163 175); }
:root.dark .chat-input-wrap__textarea::placeholder { color: rgb(107 114 128); }
.chat-input-wrap__textarea:disabled { opacity: 0.5; }

.chat-input-wrap__send {
  flex-shrink: 0;
  padding: 0.5rem;
  margin: 0.25rem;
  border-radius: 0.75rem;
  color: rgb(156 163 175);
  transition: all 200ms;
}
.chat-input-wrap__send--active {
  background: rgb(37 99 235);
  color: white;
}
.chat-input-wrap__send--active:hover {
  background: rgb(29 78 216);
}
.chat-input-wrap__send:disabled {
  cursor: not-allowed;
}
</style>
