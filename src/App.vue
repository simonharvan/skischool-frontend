<script setup lang="ts">
import { computed } from 'vue'
import { ElConfigProvider } from 'element-plus'
import elSk from 'element-plus/es/locale/lang/sk'
import elEn from 'element-plus/es/locale/lang/en'
import { useLocaleStore } from '@/stores/locale'
import { watchLocale } from '@/i18n'

const localeStore = useLocaleStore()
watchLocale(() => localeStore.locale)

const elLocale = computed(() => (localeStore.locale === 'sk' ? elSk : elEn))
</script>

<template>
  <el-config-provider :locale="elLocale">
    <router-view />
  </el-config-provider>
</template>
