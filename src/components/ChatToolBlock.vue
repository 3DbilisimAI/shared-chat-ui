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

      <!-- Results table -->
      <div v-if="rows && rows.length > 0" class="tool-block__section">
        <p class="tool-block__section-label">
          Sonuçlar
          <span v-if="truncated" class="tool-block__truncated">(kısaltıldı)</span>
        </p>
        <div class="tool-block__table-wrap">
          <table class="tool-block__table">
            <thead>
              <tr>
                <th v-for="col in columns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in rows" :key="i" :class="{ 'tool-block__row--alt': i % 2 === 1 }">
                <td v-for="col in columns" :key="col">{{ row[col] ?? '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
}>()

const open = ref(false)
const sqlCopied = ref(false)

const columns = computed(() => {
  if (!props.rows || props.rows.length === 0) return []
  return Object.keys(props.rows[0])
})

const highlightedSql = computed(() => {
  if (!props.sql) return ''
  let s = props.sql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

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
</style>
