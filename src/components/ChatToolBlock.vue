<template>
  <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden my-3 text-sm animate-scale-in">
    <!-- Header -->
    <button
      class="w-full flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      @click="open = !open"
    >
      <div class="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
        <CommandLineIcon class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      </div>
      <span class="flex-1 font-medium text-gray-700 dark:text-gray-300 truncate">{{ tool }}</span>
      <span
        v-if="rowCount != null"
        class="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium flex-shrink-0"
      >
        {{ rowCount }} satır
      </span>
      <ChevronDownIcon
        class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-out"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <!-- Body -->
    <Transition name="expand">
      <div v-if="open" class="divide-y divide-gray-100 dark:divide-gray-700/50">
        <!-- SQL block -->
        <div v-if="sql" class="p-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">SQL</p>
            <button
              class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              @click.stop="copySql"
            >
              {{ sqlCopied ? 'Kopyalandı!' : 'Kopyala' }}
            </button>
          </div>
          <pre class="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-xs leading-relaxed"><code>{{ sql }}</code></pre>
        </div>

        <!-- Results table -->
        <div v-if="rows && rows.length > 0" class="p-4">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">
            Sonuçlar
            <span v-if="truncated" class="ml-1 text-amber-600 dark:text-amber-400">(kısaltıldı)</span>
          </p>
          <div class="overflow-auto max-h-56 rounded-xl border border-gray-200 dark:border-gray-700">
            <table class="w-full text-xs border-collapse">
              <thead class="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    v-for="col in columns"
                    :key="col"
                    class="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                  >
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in rows"
                  :key="i"
                  class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                  :class="i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'"
                >
                  <td
                    v-for="col in columns"
                    :key="col"
                    class="px-3 py-2 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 max-w-[200px] truncate"
                  >
                    {{ row[col] ?? '' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>
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

async function copySql() {
  if (!props.sql) return
  try {
    await navigator.clipboard.writeText(props.sql)
    sqlCopied.value = true
    setTimeout(() => { sqlCopied.value = false }, 2000)
  } catch {
    // ignore
  }
}
</script>
