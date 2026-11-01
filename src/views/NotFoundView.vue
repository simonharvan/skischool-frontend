<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
    <div class="text-7xl font-bold text-gray-300">404</div>
    <p class="m-0 text-gray-600">{{ t('notFound.message') }}</p>
    <router-link to="/"><el-button type="primary">{{ t('notFound.home') }}</el-button></router-link>
  </div>
</template>
