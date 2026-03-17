<template>
  <div class="tool-block">
    <!-- Header -->
    <button class="tool-block__header" @click="open = !open">
      <div class="tool-block__icon">
        <CommandLineIcon class="w-3.5 h-3.5" />
      </div>
      <span class="tool-block__name">{{ tool }}</span>
      <span v-if="rowCount != null" class="tool-block__badge">{{ rowCount }} satır</span>
      <ChevronDownIcon :class="['tool-block__chevron', { 'tool-block__chevron--open': open }]" />
    </button>

    <!-- Body -->
    <div v-if="open" class="tool-block__body">
      <!-- Reasoning block -->
      <div v-if="reasoning" class="tool-block__section">
        <button class="tool-block__reasoning-header" @click.stop="reasoningOpen = !reasoningOpen">
          <span class="tool-block__reasoning-label">🧠 Düşünme süreci</span>
          <ChevronDownIcon :class="['tool-block__reasoning-chevron', { 'tool-block__reasoning-chevron--open': reasoningOpen }]" />
        </button>
        <div v-if="reasoningOpen" class="tool-block__reasoning-body">
          <pre class="tool-block__reasoning-text">{{ reasoning }}</pre>
        </div>
      </div>

      <!-- SQL block -->
      <div v-if="sql" class="tool-block__section">
        <div class="tool-block__section-header">
          <span class="tool-block__section-label">SQL</span>
          <button class="tool-block__copy-btn" @click.stop="copySql">
            {{ sqlCopied ? 'Kopyalandı!' : 'Kopyala' }}
          </button>
        </div>
        <pre class="tool-block__code"><code v-html="highlightedSql"></code></pre>
      </div>

      <!-- Error -->
      <div v-if="error" class="tool-block__section">
        <p class="tool-block__section-label">Hata</p>
        <pre class="tool-block__error">{{ error }}</pre>
      </div>

      <!-- Results table -->
      <div v-if="rows && rows.length > 0" class="tool-block__section">
        <div class="tool-block__table-toolbar">
          <p class="tool-block__section-label">
            Sonuçlar
            <span v-if="truncated" class="tool-block__truncated">(kısaltıldı)</span>
          </p>
          <input
            v-model="searchQuery"
            class="tool-block__search"
            type="text"
            placeholder="Ara..."
            @input="onSearchInput"
          />
        </div>
        <div class="tool-block__table-wrap">
          <table class="tool-block__table">
            <thead>
              <tr>
                <th
                  v-for="col in columns"
                  :key="col"
                  class="tool-block__th--sortable"
                  @click="toggleSort(col)"
                >
                  <span class="tool-block__th-content">
                    {{ col }}
                    <span class="tool-block__sort-icon">
                      <span v-if="sortCol === col">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
                      <span v-else class="tool-block__sort-idle">⇅</span>
                    </span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in filteredRows" :key="i" :class="{ 'tool-block__row--alt': i % 2 === 1 }">
                <td v-for="col in columns" :key="col">{{ formatCell(row[col]) }}</td>
              </tr>
              <tr v-if="filteredRows.length === 0">
                <td :colspan="columns.length" class="tool-block__no-results">Sonuç bulunamadı</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="tool-block__row-count">
          {{ filteredRows.length }} / {{ rows.length }} satır gösteriliyor
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDownIcon, CommandLineIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  tool: string
  input?: string
  sql?: string
  rows?: Record<string, unknown>[]
  rowCount?: number
  truncated?: boolean
  error?: string
  reasoning?: string
}>()

const open = ref(true)
const reasoningOpen = ref(false)
const sqlCopied = ref(false)

// Search / sort state
const searchQuery = ref('')
const debouncedSearch = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = searchQuery.value
  }, 300)
}

const sortCol = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(col: string) {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortCol.value = col
    sortDir.value = 'asc'
  }
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'number') {
    // Show floats with 2 decimal places; integers as-is
    return Number.isInteger(val) ? String(val) : val.toFixed(2)
  }
  return String(val)
}

const columns = computed(() => {
  if (!props.rows || props.rows.length === 0) return []
  return Object.keys(props.rows[0])
})

const filteredRows = computed(() => {
  if (!props.rows) return []
  let result = props.rows

  const q = debouncedSearch.value.trim().toLowerCase()
  if (q) {
    result = result.filter(row =>
      columns.value.some(col => {
        const v = row[col]
        return v !== null && v !== undefined && String(v).toLowerCase().includes(q)
      })
    )
  }

  if (sortCol.value) {
    const col = sortCol.value
    const dir = sortDir.value
    result = [...result].sort((a, b) => {
      const va = a[col]
      const vb = b[col]
      if (va === null || va === undefined) return 1
      if (vb === null || vb === undefined) return -1
      const na = typeof va === 'number' ? va : Number(va)
      const nb = typeof vb === 'number' ? vb : Number(vb)
      if (!isNaN(na) && !isNaN(nb)) {
        return dir === 'asc' ? na - nb : nb - na
      }
      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      return dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }

  return result
})

const highlightedSql = computed(() => {
  if (!props.sql) return ''
  let s = props.sql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Table name color-coding (before keyword highlighting, while text is still plain)
  const tableColorMap = new Map<string, number>()
  let tableColorCounter = 0
  s = s.replace(/\b(FROM|JOIN)\s+(\w+)/gi, (_match, keyword, tableName) => {
    const tblKey = tableName.toUpperCase()
    if (!tableColorMap.has(tblKey)) {
      tableColorMap.set(tblKey, tableColorCounter % 6)
      tableColorCounter++
    }
    const colorIdx = tableColorMap.get(tblKey)!
    return `${keyword} <span class="sql-tbl sql-tbl--${colorIdx}">${tableName}</span>`
  })

  // SQL keywords
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL',
    'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON',
    'GROUP\\s+BY', 'ORDER\\s+BY', 'HAVING', 'LIMIT', 'OFFSET',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
    'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW',
    'AS', 'DISTINCT', 'ALL', 'EXISTS', 'BETWEEN', 'LIKE', 'ILIKE',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'ASC', 'DESC', 'UNION', 'EXCEPT', 'INTERSECT',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
    'WITH', 'RECURSIVE', 'PARTITION\\s+BY', 'OVER',
    'TRUE', 'FALSE', 'CAST', 'COALESCE', 'NULLIF',
  ]
  const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi')
  s = s.replace(kwRegex, '<span class="sql-kw">$1</span>')

  // Strings (single-quoted)
  s = s.replace(/'([^']*)'/g, '<span class="sql-str">\'$1\'</span>')

  // Numbers
  s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="sql-num">$1</span>')

  // Comments (-- single line)
  s = s.replace(/(--.*)/g, '<span class="sql-cmt">$1</span>')

  return s
})

async function copySql() {
  if (!props.sql) return
  try {
    await navigator.clipboard.writeText(props.sql)
    sqlCopied.value = true
    setTimeout(() => { sqlCopied.value = false }, 2000)
  } catch { /* ignore */ }
}
</script>

<style scoped>
.tool-block {
  border-radius: 0.75rem;
  border: 1px solid rgb(229 231 235);
  overflow: hidden;
  margin: 0.75rem 0;
  font-size: 0.875rem;
  animation: tb-scale-in 0.3s ease-out both;
}
:root.dark .tool-block { border-color: rgb(55 65 81); }

@keyframes tb-scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

/* ── Header ── */
.tool-block__header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1rem;
  background: rgb(249 250 251);
  text-align: left;
  transition: background 150ms;
  cursor: pointer;
  border: none;
}
.tool-block__header:hover { background: rgb(243 244 246); }
:root.dark .tool-block__header { background: rgba(31 41 55 / 0.8); }
:root.dark .tool-block__header:hover { background: rgb(31 41 55); }

.tool-block__icon {
  width: 1.5rem; height: 1.5rem;
  border-radius: 0.5rem;
  background: rgb(219 234 254);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: rgb(37 99 235);
}
:root.dark .tool-block__icon { background: rgba(30 58 138 / 0.4); color: rgb(96 165 250); }

.tool-block__name {
  flex: 1;
  font-weight: 500;
  color: rgb(55 65 81);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
:root.dark .tool-block__name { color: rgb(209 213 219); }

.tool-block__badge {
  flex-shrink: 0;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: rgb(239 246 255);
  color: rgb(37 99 235);
  font-weight: 500;
}
:root.dark .tool-block__badge { background: rgba(30 58 138 / 0.3); color: rgb(96 165 250); }

.tool-block__chevron {
  width: 1rem; height: 1rem;
  flex-shrink: 0;
  color: rgb(156 163 175);
  transition: transform 300ms ease-out;
}
.tool-block__chevron--open { transform: rotate(180deg); }

/* ── Body ── */
.tool-block__body {
  animation: tb-expand 0.25s ease-out;
}
@keyframes tb-expand {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tool-block__section {
  padding: 1rem;
  border-top: 1px solid rgb(243 244 246);
}
:root.dark .tool-block__section { border-color: rgba(55 65 81 / 0.5); }

.tool-block__section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.5rem;
}

.tool-block__section-label {
  font-size: 0.75rem;
  color: rgb(107 114 128);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
:root.dark .tool-block__section-label { color: rgb(156 163 175); }

.tool-block__truncated { margin-left: 0.25rem; color: rgb(217 119 6); }
:root.dark .tool-block__truncated { color: rgb(251 191 36); }

.tool-block__copy-btn {
  font-size: 0.75rem;
  color: rgb(156 163 175);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 150ms;
}
.tool-block__copy-btn:hover { color: rgb(75 85 99); background: rgb(243 244 246); }
:root.dark .tool-block__copy-btn:hover { color: rgb(209 213 219); background: rgb(31 41 55); }

/* ── Code ── */
.tool-block__code {
  background: rgb(17 24 39); color: rgb(243 244 246);
  border-radius: 0.75rem; padding: 1rem;
  overflow-x: auto; font-size: 0.75rem; line-height: 1.6;
  margin: 0;
  font-family: 'Menlo','Monaco','Courier New',monospace;
}

/* ── SQL Syntax Highlighting ── */
.tool-block__code :deep(.sql-kw) {
  color: rgb(199 146 234);
  font-weight: 600;
  text-transform: uppercase;
}
.tool-block__code :deep(.sql-str) {
  color: rgb(195 232 141);
}
.tool-block__code :deep(.sql-num) {
  color: rgb(247 140 108);
}
.tool-block__code :deep(.sql-cmt) {
  color: rgb(99 119 139);
  font-style: italic;
}

/* ── Table toolbar (search + label row) ── */
.tool-block__table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tool-block__search {
  flex-shrink: 0;
  width: 10rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid rgb(209 213 219);
  background: rgb(255 255 255);
  color: rgb(55 65 81);
  outline: none;
  transition: border-color 150ms, box-shadow 150ms;
}
.tool-block__search:focus {
  border-color: rgb(96 165 250);
  box-shadow: 0 0 0 2px rgba(96 165 250 / 0.2);
}
.tool-block__search::placeholder { color: rgb(156 163 175); }
:root.dark .tool-block__search {
  background: rgb(17 24 39);
  border-color: rgb(55 65 81);
  color: rgb(209 213 219);
}
:root.dark .tool-block__search:focus {
  border-color: rgb(96 165 250);
}

/* ── Sortable headers ── */
.tool-block__th--sortable {
  cursor: pointer;
  user-select: none;
}
.tool-block__th--sortable:hover { background: rgb(243 244 246) !important; }
:root.dark .tool-block__th--sortable:hover { background: rgb(55 65 81) !important; }

.tool-block__th-content {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.tool-block__sort-icon {
  font-size: 0.65rem;
  line-height: 1;
  color: rgb(96 165 250);
}
.tool-block__sort-idle {
  color: rgb(156 163 175);
  font-size: 0.65rem;
}

/* ── Row count ── */
.tool-block__row-count {
  margin-top: 0.375rem;
  font-size: 0.7rem;
  color: rgb(107 114 128);
  text-align: right;
}
:root.dark .tool-block__row-count { color: rgb(107 114 128); }

/* ── No results ── */
.tool-block__no-results {
  text-align: center;
  padding: 1rem;
  color: rgb(156 163 175);
  font-style: italic;
}

/* ── Table ── */
.tool-block__table-wrap {
  overflow: auto;
  max-height: 14rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(229 231 235);
}
:root.dark .tool-block__table-wrap { border-color: rgb(55 65 81); }

.tool-block__table {
  width: 100%;
  font-size: 0.75rem;
  border-collapse: collapse;
}
.tool-block__table thead { position: sticky; top: 0; }
.tool-block__table th {
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
  background: rgb(249 250 251);
  color: rgb(75 85 99);
  border-bottom: 1px solid rgb(229 231 235);
}
:root.dark .tool-block__table th { background: rgb(31 41 55); color: rgb(209 213 219); border-color: rgb(55 65 81); }

.tool-block__table td {
  padding: 0.5rem 0.75rem;
  color: rgb(55 65 81);
  border-bottom: 1px solid rgb(243 244 246);
  max-width: 200px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
:root.dark .tool-block__table td { color: rgb(209 213 219); border-color: rgb(31 41 55); }

.tool-block__row--alt { background: rgba(249 250 251 / 0.5); }
:root.dark .tool-block__row--alt { background: rgba(31 41 55 / 0.3); }

.tool-block__table tr:hover td { background: rgba(239 246 255 / 0.5); }
:root.dark .tool-block__table tr:hover td { background: rgba(30 58 138 / 0.1); }

/* ── Table name highlights ── */
.tool-block__code :deep(.sql-tbl) {
  border-radius: 2px;
  padding: 0 2px;
}
.tool-block__code :deep(.sql-tbl--0) { background: rgba(147, 197, 253, 0.15); }
.tool-block__code :deep(.sql-tbl--1) { background: rgba(167, 243, 208, 0.15); }
.tool-block__code :deep(.sql-tbl--2) { background: rgba(253, 186, 116, 0.15); }
.tool-block__code :deep(.sql-tbl--3) { background: rgba(196, 181, 253, 0.15); }
.tool-block__code :deep(.sql-tbl--4) { background: rgba(252, 165, 165, 0.15); }
.tool-block__code :deep(.sql-tbl--5) { background: rgba(253, 224, 71, 0.12); }

/* ── Error ── */
.tool-block__error {
  background: rgba(239 68 68 / 0.1);
  border: 1px solid rgba(239 68 68 / 0.3);
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  color: rgb(185 28 28);
  line-height: 1.5;
  font-family: 'Menlo','Monaco','Courier New',monospace;
  white-space: pre-wrap;
  word-break: break-word;
}
:root.dark .tool-block__error {
  background: rgba(239 68 68 / 0.1);
  border-color: rgba(239 68 68 / 0.25);
  color: rgb(252 165 165);
}

/* ── Reasoning ── */
.tool-block__reasoning-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.375rem 0;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}

.tool-block__reasoning-label {
  font-size: 0.75rem;
  color: rgb(109 40 217);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
:root.dark .tool-block__reasoning-label { color: rgb(167 139 250); }

.tool-block__reasoning-chevron {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  color: rgb(139 92 246);
  transition: transform 300ms ease-out;
}
.tool-block__reasoning-chevron--open { transform: rotate(180deg); }

.tool-block__reasoning-body {
  margin-top: 0.375rem;
  animation: tb-expand 0.2s ease-out;
}

.tool-block__reasoning-text {
  background: rgba(237 233 254 / 0.6);
  border: 1px solid rgba(167 139 250 / 0.3);
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.75rem;
  color: rgb(76 29 149);
  line-height: 1.6;
  font-family: 'Menlo','Monaco','Courier New',monospace;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 12rem;
  overflow-y: auto;
  margin: 0;
}
:root.dark .tool-block__reasoning-text {
  background: rgba(109 40 217 / 0.1);
  border-color: rgba(167 139 250 / 0.25);
  color: rgb(221 214 254);
}
</style>
