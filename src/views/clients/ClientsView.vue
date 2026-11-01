<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@element-plus/icons-vue'
import ClientEditDrawer from '@/components/clients/ClientEditDrawer.vue'
import ClientLessonsDialog from '@/components/clients/ClientLessonsDialog.vue'
import { getClients } from '@/api/clients'
import type { Client } from '@/types'

const PAGE_SIZE = 25
const { t } = useI18n()

const query = ref('')
const page = ref(1)
const clients = ref<Client[]>([])
const total = ref(0)
const loading = ref(false)
const drawer = ref<InstanceType<typeof ClientEditDrawer>>()
const lessonsDialog = ref<InstanceType<typeof ClientLessonsDialog>>()

let seq = 0
async function load() {
  const mine = ++seq
  loading.value = true
  try {
    const result = await getClients({
      query: query.value || undefined,
      limit: PAGE_SIZE,
      offset: (page.value - 1) * PAGE_SIZE,
    })
    if (mine !== seq) return
    clients.value = result.clients
    total.value = result.clientsCount
  } finally {
    if (mine === seq) loading.value = false
  }
}

// debounced search; a new search always starts on the first page
let timer: ReturnType<typeof setTimeout> | undefined
watch(query, () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (page.value === 1) load()
    else page.value = 1
  }, 500)
})
watch(page, load)
onMounted(load)
</script>

<template>
  <div>
    <el-input v-model="query" :prefix-icon="Search" :placeholder="t('clients.search')" clearable class="mb-4 !max-w-lg" />

    <el-table v-loading="loading" :data="clients" row-key="id">
      <el-table-column prop="name" :label="t('name')" min-width="160" />
      <el-table-column prop="email" :label="t('email')" min-width="200" />
      <el-table-column prop="phone" :label="t('phone')" min-width="130" />
      <el-table-column prop="phone_2" :label="t('phone2')" min-width="130" />
      <el-table-column :label="t('actions')" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="lessonsDialog?.open(row as Client)">{{ t('show') }}</el-button>
          <el-button size="small" type="primary" @click="drawer?.open(row as Client)">{{ t('edit') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      class="mt-4"
      background
      layout="prev, pager, next"
      :page-size="PAGE_SIZE"
      :total="total"
      hide-on-single-page
    />

    <ClientEditDrawer ref="drawer" @saved="load" />
    <ClientLessonsDialog ref="lessonsDialog" />
  </div>
</template>
