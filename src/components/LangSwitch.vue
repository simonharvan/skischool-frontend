<script setup lang="ts">
import { useLocaleStore } from '@/stores/locale'

const store = useLocaleStore()
</script>

<template>
  <el-radio-group :model-value="store.locale" size="small" @change="(v: any) => store.setLocale(v)">
    <el-radio-button value="sk">SK</el-radio-button>
    <el-radio-button value="en">EN</el-radio-button>
  </el-radio-group>
</template>
