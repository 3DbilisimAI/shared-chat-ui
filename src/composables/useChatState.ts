/**
 * Shared chat state composable — used by both kingslanding and lannisters.
 *
 * Encapsulates thread/message CRUD, streaming SSE callbacks, and scroll helpers
 * so each project's ChatView only handles layout and project-specific UX.
 */
import { ref, nextTick } from 'vue'
import type { Ref } from 'vue'
import {
  type Thread,
  type ThreadMessage,
  type ToolCall,
  type ChatStreamRequest,
  type SSECallbacks,
  streamChat,
  listThreads,
  createThread,
  deleteThread,
  getThreadMessages,
} from '../services/chatApi'

// ── Types ────────────────────────────────────────────────────────────────────

export interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  toolCalls?: ToolCall[]
}

export interface UseChatStateOptions {
  /** Called after the active thread changes (e.g. to update URL). */
  onThreadChange?: (threadId: string | null) => void
  /** Called when streaming finishes (after message is finalized). */
  onStreamDone?: () => void
}

// ── Composable ───────────────────────────────────────────────────────────────

export function useChatState(options: UseChatStateOptions = {}) {
  // ── Thread state ───────────────────────────────────────────────────────────
  const threads = ref<Thread[]>([])
  const activeThreadId = ref<string | null>(null)

  // ── Message state ──────────────────────────────────────────────────────────
  const messages = ref<DisplayMessage[]>([])

  // ── Streaming state ────────────────────────────────────────────────────────
  const streaming = ref(false)
  const streamingText = ref('')
  const streamingToolCalls = ref<ToolCall[]>([])
  const statusStep = ref('')
  const statusMessage = ref('')

  // ── Internal ───────────────────────────────────────────────────────────────
  let abortController: AbortController | null = null
  let msgIdCounter = 0

  function newMsgId(): string {
    return `msg-${Date.now()}-${++msgIdCounter}`
  }

  // ── Scroll ─────────────────────────────────────────────────────────────────
  const scrollAnchorRef = ref<HTMLElement>() as Ref<HTMLElement | undefined>

  function scrollToBottom() {
    nextTick(() => {
      scrollAnchorRef.value?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  // ── Thread CRUD ────────────────────────────────────────────────────────────

  async function loadThreads() {
    try {
      threads.value = await listThreads()
    } catch {
      threads.value = []
    }
  }

  async function loadMessages(threadId: string) {
    try {
      const raw: ThreadMessage[] = await getThreadMessages(threadId)
      messages.value = raw.map((m) => ({
        id: newMsgId(),
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        toolCalls: m.tool_calls,
      }))
      scrollToBottom()
    } catch {
      messages.value = []
    }
  }

  async function handleNewThread() {
    if (streaming.value) return
    try {
      const { thread_id } = await createThread()
      activeThreadId.value = thread_id
      messages.value = []
      await loadThreads()
      options.onThreadChange?.(thread_id)
    } catch { /* ignore */ }
  }

  async function handleSelectThread(threadId: string) {
    if (streaming.value) return
    if (threadId === activeThreadId.value) return
    activeThreadId.value = threadId
    messages.value = []
    await loadMessages(threadId)
    options.onThreadChange?.(threadId)
  }

  async function handleDeleteThread(threadId: string) {
    try {
      await deleteThread(threadId)
      if (activeThreadId.value === threadId) {
        activeThreadId.value = null
        messages.value = []
        options.onThreadChange?.(null)
      }
      await loadThreads()
    } catch { /* ignore */ }
  }

  // ── Send message & streaming ───────────────────────────────────────────────

  async function sendMessage(text: string) {
    if (!text.trim() || streaming.value) return

    // Push user message
    messages.value.push({
      id: newMsgId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    })
    scrollToBottom()

    // Reset streaming state
    streaming.value = true
    streamingText.value = ''
    streamingToolCalls.value = []
    statusStep.value = ''
    statusMessage.value = ''
    abortController = new AbortController()

    const request: ChatStreamRequest = {
      message: text,
      thread_id: activeThreadId.value ?? undefined,
    }

    try {
      await streamChat(request, createStreamCallbacks(), abortController.signal)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      messages.value.push({
        id: newMsgId(),
        role: 'assistant',
        content: `Hata: ${err instanceof Error ? err.message : String(err)}`,
      })
    } finally {
      streaming.value = false
      streamingText.value = ''
      streamingToolCalls.value = []
      statusStep.value = ''
      statusMessage.value = ''
      abortController = null
    }
  }

  function stopStreaming() {
    abortController?.abort()
  }

  // ── SSE Callback factory ───────────────────────────────────────────────────

  function createStreamCallbacks(): SSECallbacks {
    return {
      onStatus(e) {
        statusStep.value = e.step
        statusMessage.value = e.message
        scrollToBottom()
      },

      onToolStart(e) {
        statusMessage.value = ''
        streamingToolCalls.value.push({
          tool: e.tool,
          input: e.input,
        })
        scrollToBottom()
      },

      onSqlToken(e) {
        const idx = streamingToolCalls.value.length - 1
        if (idx >= 0) {
          const tc = streamingToolCalls.value[idx]
          streamingToolCalls.value[idx] = { ...tc, sql: (tc.sql || '') + e.token }
        }
      },

      onSqlGenerated(e) {
        const idx = streamingToolCalls.value.length - 1
        if (idx >= 0) {
          const tc = streamingToolCalls.value[idx]
          streamingToolCalls.value[idx] = { ...tc, sql: e.sql }
        }
        scrollToBottom()
      },

      onQueryResult(e) {
        const idx = streamingToolCalls.value.length - 1
        if (idx >= 0) {
          const tc = streamingToolCalls.value[idx]
          streamingToolCalls.value[idx] = {
            ...tc,
            rows: e.rows,
            row_count: e.row_count,
            truncated: e.truncated,
            error: e.error || tc.error,
          }
        }
        scrollToBottom()
      },

      onToolResult(e) {
        // Fallback for backends that send combined tool_result events
        const idx = streamingToolCalls.value.length - 1
        if (idx >= 0) {
          const tc = streamingToolCalls.value[idx]
          streamingToolCalls.value[idx] = {
            ...tc,
            sql: e.sql ?? tc.sql,
            rows: e.rows ?? tc.rows,
            row_count: e.row_count ?? tc.row_count,
            truncated: e.truncated ?? tc.truncated,
          }
        }
        scrollToBottom()
      },

      onToken(e) {
        statusMessage.value = ''
        streamingText.value += e.token
        scrollToBottom()
      },

      onDone(e) {
        // Update thread ID if backend provides one
        if (e.thread_id) {
          activeThreadId.value = e.thread_id
          options.onThreadChange?.(e.thread_id)
        }

        // Finalize assistant message
        const answer = e.response || e.message || streamingText.value
        messages.value.push({
          id: newMsgId(),
          role: 'assistant',
          content: answer ?? '',
          timestamp: new Date().toISOString(),
          toolCalls: streamingToolCalls.value.length > 0
            ? streamingToolCalls.value.map(tc => ({
                tool: tc.tool,
                input: tc.input,
                sql: tc.sql,
                rows: tc.rows ? [...tc.rows] : undefined,
                row_count: tc.row_count,
                truncated: tc.truncated,
                error: tc.error,
              }))
            : undefined,
        })

        loadThreads()
        scrollToBottom()
        options.onStreamDone?.()
      },

      onError(e) {
        messages.value.push({
          id: newMsgId(),
          role: 'assistant',
          content: `Hata: ${e.message}`,
        })
        scrollToBottom()
      },
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    // State
    threads,
    activeThreadId,
    messages,
    streaming,
    streamingText,
    streamingToolCalls,
    statusStep,
    statusMessage,
    scrollAnchorRef,

    // Actions
    loadThreads,
    loadMessages,
    handleNewThread,
    handleSelectThread,
    handleDeleteThread,
    sendMessage,
    stopStreaming,
    scrollToBottom,
  }
}
