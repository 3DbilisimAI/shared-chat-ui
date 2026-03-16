<template>
  <div class="group py-4">
    <div class="flex gap-4">
      <!-- Avatar -->
      <div class="flex-shrink-0">
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            role === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
          ]"
        >
          {{ role === 'user' ? 'S' : 'AI' }}
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
          {{ role === 'user' ? 'Sen' : 'Kingslanding' }}
        </p>

        <!-- Typing indicator -->
        <div v-if="isTyping" class="flex items-center gap-1.5 py-2">
          <span
            v-for="i in 3"
            :key="i"
            class="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
            :style="{
              animation: 'bounce 1.4s ease-in-out infinite',
              animationDelay: `${(i - 1) * 0.16}s`,
            }"
          />
        </div>

        <!-- Message content -->
        <template v-else>
          <div
            v-if="hasMarkdown"
            v-html="renderedContent"
            class="prose-chat text-sm text-gray-700 dark:text-gray-300"
          />
          <p v-else class="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">{{ content }}</p>
        </template>

        <!-- Footer: timestamp + actions -->
        <div
          v-if="!isTyping && content"
          class="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <span v-if="timestamp" class="text-xs text-gray-400 dark:text-gray-500">
            {{ formattedTime }}
          </span>
          <button
            v-if="role === 'assistant'"
            class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Kopyala"
            @click="copyContent"
          >
            <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg v-else class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  isTyping?: boolean
}>()

const copied = ref(false)

const hasMarkdown = computed(() =>
  /```|#{1,6}\s|\*\*|__|\|.*\||\n[-*]\s|\n\d+\.\s/.test(props.content)
)

const renderedContent = computed(() => {
  let text = props.content

  // Escape HTML
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Code blocks with copy button
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, lang, code) => {
    const trimmedCode = code.trim()
    return `<pre><code class="language-${lang || 'text'}">${trimmedCode}</code></pre>`
  })

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Headers
  text = text.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
  text = text.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
  text = text.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')

  // Unordered lists
  text = text.replace(/^[-*] (.+)$/gm, '<li>$1</li>')
  text = text.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

  // Ordered lists
  text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Blockquotes
  text = text.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')

  // Tables
  text = text.replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_match, header, body) => {
    const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean)
    const rows = body.trim().split('\n').map((row: string) =>
      row.split('|').map((c: string) => c.trim()).filter(Boolean)
    )
    let html = '<table><thead><tr>'
    headers.forEach((h: string) => { html += `<th>${h}</th>` })
    html += '</tr></thead><tbody>'
    rows.forEach((row: string[]) => {
      html += '<tr>'
      row.forEach((c: string) => { html += `<td>${c}</td>` })
      html += '</tr>'
    })
    html += '</tbody></table>'
    return html
  })

  // Line breaks (but not inside pre/code)
  text = text.replace(/(?<!\>)\n(?!\<)/g, '<br>')

  return text
})

const formattedTime = computed(() => {
  if (!props.timestamp) return ''
  try {
    return new Date(props.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return props.timestamp
  }
})

async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback
    const el = document.createElement('textarea')
    el.value = props.content
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>
