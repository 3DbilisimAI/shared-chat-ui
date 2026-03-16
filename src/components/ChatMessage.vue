<template>
  <div :class="['flex', role === 'user' ? 'justify-end' : 'justify-start', 'mb-3']">
    <div :class="bubbleClasses">
      <!-- Typing indicator -->
      <div v-if="isTyping" class="flex items-center gap-1 py-1">
        <span
          v-for="i in 3"
          :key="i"
          class="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
          :style="{ animationDelay: `${(i - 1) * 0.15}s` }"
        />
      </div>

      <!-- Content -->
      <template v-else>
        <div v-if="hasCodeBlock" v-html="renderedContent" class="prose-sm" />
        <p v-else class="whitespace-pre-wrap text-sm leading-relaxed">{{ content }}</p>
      </template>

      <!-- Timestamp -->
      <p v-if="timestamp" class="text-xs mt-1 opacity-60">{{ formattedTime }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  isTyping?: boolean
}>()

const bubbleClasses = computed(() => [
  'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
  props.role === 'user'
    ? 'bg-blue-600 text-white rounded-br-sm'
    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm',
])

const hasCodeBlock = computed(() => props.content.includes('```'))

const renderedContent = computed(() => {
  if (!hasCodeBlock.value) return props.content

  return props.content
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _lang, code) => {
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `<pre class="bg-gray-900 text-gray-100 rounded-lg p-3 my-2 overflow-x-auto text-xs"><code>${escaped}</code></pre>`
    })
    .replace(/\n/g, '<br>')
})

const formattedTime = computed(() => {
  if (!props.timestamp) return ''
  try {
    return new Date(props.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return props.timestamp
  }
})
</script>
