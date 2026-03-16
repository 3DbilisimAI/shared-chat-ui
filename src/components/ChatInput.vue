<template>
  <div class="px-3 py-3">
    <div class="relative flex items-end gap-2 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 shadow-sm focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:shadow-md transition-all duration-200">
      <textarea
        ref="textareaRef"
        v-model="text"
        :disabled="disabled"
        rows="1"
        placeholder="Mesajınızı yazın..."
        class="flex-1 resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm focus:outline-none disabled:opacity-50 overflow-y-auto"
        :style="{ height: textareaHeight, maxHeight: '160px' }"
        @keydown.enter.exact.prevent="send"
        @keydown.shift.enter="newline"
        @input="resize"
      />
      <button
        :disabled="disabled || !text.trim()"
        :class="[
          'flex-shrink-0 p-2.5 m-1.5 rounded-xl transition-all duration-200',
          text.trim()
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md scale-100'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 scale-95',
        ]"
        @click="send"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
}>()

const text = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const textareaHeight = ref('auto')

function resize() {
  nextTick(() => {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, 160)
    textareaHeight.value = `${newHeight}px`
  })
}

function newline() {
  // default behavior inserts newline
}

function send() {
  const msg = text.value.trim()
  if (!msg) return
  emit('send', msg)
  text.value = ''
  textareaHeight.value = 'auto'
}
</script>
