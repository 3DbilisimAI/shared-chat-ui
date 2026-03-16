<template>
  <div class="flex items-center gap-2 px-4 py-2">
    <span class="relative flex h-2.5 w-2.5">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
    </span>
    <span class="text-sm text-gray-500 dark:text-gray-400">{{ message || step }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  step: string
  message?: string
}>()
</script>
