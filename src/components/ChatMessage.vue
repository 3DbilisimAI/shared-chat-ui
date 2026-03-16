<template>
  <div :class="['chat-msg', `chat-msg--${role}`]">
    <!-- User message: right-aligned bubble -->
    <div v-if="role === 'user'" class="chat-msg__row chat-msg__row--reverse">
      <div class="chat-msg__avatar chat-msg__avatar--user">S</div>
      <div class="chat-msg__body">
        <div class="chat-msg__bubble chat-msg__bubble--user">
          <p class="chat-msg__text">{{ content }}</p>
        </div>
        <p v-if="timestamp" class="chat-msg__time chat-msg__time--right">{{ formattedTime }}</p>
      </div>
    </div>

    <!-- Assistant message: left-aligned flat -->
    <div v-else class="chat-msg__row">
      <div class="chat-msg__avatar chat-msg__avatar--ai">AI</div>
      <div class="chat-msg__body">
        <p class="chat-msg__label">Kingslanding</p>

        <!-- Typing indicator -->
        <div v-if="isTyping" class="chat-msg__typing">
          <span v-for="i in 3" :key="i" class="chat-msg__dot" :style="{ animationDelay: `${(i - 1) * 0.16}s` }" />
        </div>

        <!-- Content -->
        <template v-else>
          <div v-if="hasMarkdown" v-html="renderedContent" class="chat-msg__markdown" />
          <p v-else class="chat-msg__text">{{ content }}</p>
        </template>

        <!-- Footer -->
        <div v-if="!isTyping && content" class="chat-msg__footer">
          <span v-if="timestamp" class="chat-msg__time">{{ formattedTime }}</span>
          <button class="chat-msg__copy" title="Kopyala" @click="copyContent">
            <svg v-if="!copied" class="chat-msg__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg v-else class="chat-msg__icon chat-msg__icon--ok" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  let t = props.content
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`)
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>')
  t = t.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  t = t.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  t = t.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  t = t.replace(/^[-*] (.+)$/gm, '<li>$1</li>')
  t = t.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  t = t.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  t = t.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
  t = t.replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_, header, body) => {
    const hs = header.split('|').map((h: string) => h.trim()).filter(Boolean)
    const rs = body.trim().split('\n').map((r: string) => r.split('|').map((c: string) => c.trim()).filter(Boolean))
    let html = '<table><thead><tr>' + hs.map((h: string) => `<th>${h}</th>`).join('') + '</tr></thead><tbody>'
    rs.forEach((row: string[]) => { html += '<tr>' + row.map((c: string) => `<td>${c}</td>`).join('') + '</tr>' })
    return html + '</tbody></table>'
  })
  t = t.replace(/(?<!\>)\n(?!\<)/g, '<br>')
  return t
})

const formattedTime = computed(() => {
  if (!props.timestamp) return ''
  try { return new Date(props.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  catch { return props.timestamp }
})

async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.content)
  } catch {
    const el = document.createElement('textarea')
    el.value = props.content
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
/* ── Layout ── */
.chat-msg { padding: 0.75rem 0; }

.chat-msg__row {
  display: flex;
  gap: 0.5rem;
  max-width: 80%;
}
.chat-msg__row--reverse { flex-direction: row-reverse; margin-left: auto; max-width: 60%; }
.chat-msg--user .chat-msg__row { margin-left: auto; }

.chat-msg__body { flex: 1; min-width: 0; }

/* ── Avatar ── */
.chat-msg__avatar {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}
.chat-msg__avatar--user { background: rgb(37 99 235); }
.chat-msg__avatar--ai { background: linear-gradient(135deg, rgb(16 185 129), rgb(13 148 136)); }

/* ── Bubble (user) ── */
.chat-msg__bubble--user {
  background: rgb(37 99 235);
  color: white;
  border-radius: 1rem 1rem 0.25rem 1rem;
  padding: 0.625rem 1rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}

/* ── Label ── */
.chat-msg__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(107 114 128);
  margin-bottom: 0.25rem;
}
:root.dark .chat-msg__label { color: rgb(156 163 175); }

/* ── Text ── */
.chat-msg__text {
  font-size: 0.875rem;
  line-height: 1.625;
  white-space: pre-wrap;
  word-break: break-word;
}
.chat-msg--assistant .chat-msg__text { color: rgb(31 41 55); }
:root.dark .chat-msg--assistant .chat-msg__text { color: rgb(229 231 235); }

/* ── Typing ── */
.chat-msg__typing { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0; }
.chat-msg__dot {
  width: 0.5rem; height: 0.5rem;
  border-radius: 9999px;
  background: rgb(156 163 175);
  animation: msg-bounce 1.4s ease-in-out infinite;
}
@keyframes msg-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* ── Footer ── */
.chat-msg__footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.375rem;
  opacity: 0;
  transition: opacity 200ms;
}
.chat-msg:hover .chat-msg__footer { opacity: 1; }

.chat-msg__time {
  font-size: 0.75rem;
  color: rgb(156 163 175);
}
.chat-msg__time--right { text-align: right; margin-top: 0.25rem; font-size: 0.75rem; color: rgb(156 163 175); opacity: 0; transition: opacity 200ms; }
.chat-msg:hover .chat-msg__time--right { opacity: 1; }

.chat-msg__copy {
  padding: 0.25rem;
  border-radius: 0.25rem;
  color: rgb(156 163 175);
  transition: all 150ms;
}
.chat-msg__copy:hover { background: rgb(243 244 246); color: rgb(75 85 99); }
:root.dark .chat-msg__copy:hover { background: rgb(31 41 55); color: rgb(209 213 219); }

.chat-msg__icon { width: 0.875rem; height: 0.875rem; }
.chat-msg__icon--ok { color: rgb(34 197 94); }

/* ══════════════════════════════════════════════════════
   MARKDOWN — fully self-contained, no external deps
   ══════════════════════════════════════════════════════ */
.chat-msg__markdown { font-size: 0.875rem; line-height: 1.625; color: rgb(31 41 55); }
:root.dark .chat-msg__markdown { color: rgb(229 231 235); }

.chat-msg__markdown :deep(pre) {
  background: rgb(17 24 39); color: rgb(243 244 246);
  border-radius: 0.75rem; padding: 1rem; margin: 0.75rem 0;
  overflow-x: auto; font-size: 0.8125rem; line-height: 1.6;
}
.chat-msg__markdown :deep(pre code) { font-family: 'Menlo','Monaco','Courier New',monospace; font-size: 0.8125rem; }
.chat-msg__markdown :deep(code:not(pre code)) {
  background: rgb(243 244 246); color: rgb(31 41 55);
  padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8125rem;
}
:root.dark .chat-msg__markdown :deep(code:not(pre code)) { background: rgb(31 41 55); color: rgb(229 231 235); }

.chat-msg__markdown :deep(h1) { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.chat-msg__markdown :deep(h2) { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem; }
.chat-msg__markdown :deep(h3) { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.375rem; }
.chat-msg__markdown :deep(strong) { font-weight: 600; }
.chat-msg__markdown :deep(ul), .chat-msg__markdown :deep(ol) { padding-left: 1.5rem; margin: 0.5rem 0; }
.chat-msg__markdown :deep(ul) { list-style-type: disc; }
.chat-msg__markdown :deep(ol) { list-style-type: decimal; }
.chat-msg__markdown :deep(li) { margin-bottom: 0.25rem; }
.chat-msg__markdown :deep(blockquote) {
  border-left: 3px solid rgb(209 213 219); padding-left: 1rem;
  color: rgb(107 114 128); font-style: italic; margin: 0.5rem 0;
}
:root.dark .chat-msg__markdown :deep(blockquote) { border-color: rgb(75 85 99); color: rgb(156 163 175); }
.chat-msg__markdown :deep(table) { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
.chat-msg__markdown :deep(th) {
  background: rgb(243 244 246); padding: 0.375rem 0.75rem;
  text-align: left; font-size: 0.75rem; font-weight: 600;
  border: 1px solid rgb(229 231 235);
}
:root.dark .chat-msg__markdown :deep(th) { background: rgb(31 41 55); border-color: rgb(55 65 81); }
.chat-msg__markdown :deep(td) {
  padding: 0.375rem 0.75rem; font-size: 0.875rem;
  border: 1px solid rgb(229 231 235);
}
:root.dark .chat-msg__markdown :deep(td) { border-color: rgb(55 65 81); }
.chat-msg__markdown :deep(a) { color: rgb(37 99 235); text-decoration: underline; }
:root.dark .chat-msg__markdown :deep(a) { color: rgb(96 165 250); }
</style>
