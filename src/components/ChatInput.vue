<template>
  <div class="flex items-end gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
    <textarea
      ref="textareaRef"
      v-model="text"
      :disabled="disabled"
      rows="1"
      placeholder="Mesajınızı yazın..."
      class="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 overflow-y-auto"
      :style="{ height: textareaHeight }"
      @keydown.enter.exact.prevent="send"
      @keydown.shift.enter="newline"
      @input="resize"
    />
    <button
      :disabled="disabled || !text.trim()"
      class="flex-shrink-0 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
      @click="send"
    >
      <PaperAirplaneIcon class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { PaperAirplaneIcon } from '@heroicons/vue/24/solid'

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
    const newHeight = Math.min(el.scrollHeight, 120)
    textareaHeight.value = `${newHeight}px`
  })
}

function newline() {
  // default browser behavior inserts newline
}

function send() {
  const msg = text.value.trim()
  if (!msg) return
  emit('send', msg)
  text.value = ''
  textareaHeight.value = 'auto'
}
</script>
