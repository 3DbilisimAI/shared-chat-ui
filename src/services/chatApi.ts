/**
 * Chat API service for communicating with the kingslanding chat backend.
 */

const BASE_URL = import.meta.env.VITE_CHAT_API_URL || ''

// ── Types ────────────────────────────────────────────────────────────────────

export interface Thread {
  thread_id: string
  title?: string
  created_at?: string
  updated_at?: string
}

export interface ThreadMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  tool: string
  input?: string
  sql?: string
  rows?: Record<string, unknown>[]
  row_count?: number
  truncated?: boolean
}

export interface ChatStreamRequest {
  message: string
  thread_id?: string
  user_id?: string
}

// ── SSE Event Types ───────────────────────────────────────────────────────────

export interface StatusEvent {
  type: 'status'
  step: string
  message: string
}

export interface ToolStartEvent {
  type: 'tool_start'
  tool: string
  input?: string
}

export interface ToolResultEvent {
  type: 'tool_result'
  tool: string
  sql?: string
  rows?: Record<string, unknown>[]
  row_count?: number
  truncated?: boolean
}

export interface SqlGeneratedEvent {
  type: 'sql_generated'
  sql: string
}

export interface QueryResultEvent {
  type: 'query_result'
  rows: Record<string, unknown>[]
  row_count: number
  truncated?: boolean
}

export interface TokenEvent {
  type: 'token'
  token: string
}

export interface DoneEvent {
  type: 'done'
  thread_id: string
  message?: string
}

export interface ErrorEvent {
  type: 'error'
  message: string
}

export type ChatSSEEvent =
  | StatusEvent
  | ToolStartEvent
  | ToolResultEvent
  | SqlGeneratedEvent
  | QueryResultEvent
  | TokenEvent
  | DoneEvent
  | ErrorEvent

export interface SSECallbacks {
  onStatus?: (event: StatusEvent) => void
  onToolStart?: (event: ToolStartEvent) => void
  onToolResult?: (event: ToolResultEvent) => void
  onSqlGenerated?: (event: SqlGeneratedEvent) => void
  onQueryResult?: (event: QueryResultEvent) => void
  onToken?: (event: TokenEvent) => void
  onDone?: (event: DoneEvent) => void
  onError?: (event: ErrorEvent) => void
}

// ── Streaming ────────────────────────────────────────────────────────────────

export async function streamChat(
  request: ChatStreamRequest,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''

      for (const part of parts) {
        const line = part.trim()
        if (!line.startsWith('data:')) continue
        const json = line.slice(5).trim()
        if (!json) continue

        let event: ChatSSEEvent
        try {
          event = JSON.parse(json)
        } catch {
          continue
        }

        switch (event.type) {
          case 'status':       callbacks.onStatus?.(event);       break
          case 'tool_start':   callbacks.onToolStart?.(event);    break
          case 'tool_result':  callbacks.onToolResult?.(event);   break
          case 'sql_generated': callbacks.onSqlGenerated?.(event); break
          case 'query_result': callbacks.onQueryResult?.(event);  break
          case 'token':        callbacks.onToken?.(event);        break
          case 'done':         callbacks.onDone?.(event);         break
          case 'error':        callbacks.onError?.(event);        break
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ── Thread CRUD ───────────────────────────────────────────────────────────────

export async function listThreads(): Promise<Thread[]> {
  const res = await fetch(`${BASE_URL}/api/threads`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createThread(): Promise<{ thread_id: string }> {
  const res = await fetch(`${BASE_URL}/api/threads`, { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteThread(threadId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/threads/${threadId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
  const res = await fetch(`${BASE_URL}/api/threads/${threadId}/messages`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
