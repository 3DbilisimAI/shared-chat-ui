<template>
  <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden my-2 text-sm">
    <!-- Header -->
    <button
      class="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
      @click="open = !open"
    >
      <CommandLineIcon class="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
      <span class="flex-1 font-medium text-gray-700 dark:text-gray-300 truncate">{{ tool }}</span>
      <span
        v-if="rowCount != null"
        class="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex-shrink-0"
      >
        {{ rowCount }} satır
      </span>
      <ChevronDownIcon
        class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <!-- Body -->
    <div v-if="open" class="divide-y divide-gray-200 dark:divide-gray-700">
      <!-- SQL block -->
      <div v-if="sql" class="p-3">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">SQL</p>
        <pre class="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto text-xs leading-relaxed"><code>{{ sql }}</code></pre>
      </div>

      <!-- Results table -->
      <div v-if="rows && rows.length > 0" class="p-3">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">
          Sonuçlar
          <span v-if="truncated" class="ml-1 text-yellow-600 dark:text-yellow-400">(kısaltıldı)</span>
        </p>
        <div class="overflow-auto max-h-48 rounded-lg border border-gray-200 dark:border-gray-700">
          <table class="w-full text-xs border-collapse">
            <thead class="sticky top-0 bg-gray-100 dark:bg-gray-800">
              <tr>
                <th
                  v-for="col in columns"
                  :key="col"
                  class="px-2 py-1.5 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in rows"
                :key="i"
                :class="i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'"
              >
                <td
                  v-for="col in columns"
                  :key="col"
                  class="px-2 py-1.5 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700/50 max-w-[200px] truncate"
                >
                  {{ row[col] ?? '' }}
                </td>
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

const columns = computed(() => {
  if (!props.rows || props.rows.length === 0) return []
  return Object.keys(props.rows[0])
})
</script>
