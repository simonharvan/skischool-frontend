<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LessonPayDialog from '@/components/lessons/LessonPayDialog.vue'
import { getLessons } from '@/api/lessons'
import type { Client, Lesson } from '@/types'
import { durationLabel, formatNiceDate } from '@/utils/date'

const { t } = useI18n()

const visible = ref(false)
const loading = ref(false)
const client = ref<Client | null>(null)
const lessons = ref<Lesson[]>([])
const payDialog = ref<InstanceType<typeof LessonPayDialog>>()

const sum = (status: 'paid' | 'unpaid') =>
  lessons.value.filter((l) => l.status === status).reduce((acc, l) => acc + Number(l.price), 0)
const paidSum = computed(() => sum('paid'))
const unpaidSum = computed(() => sum('unpaid'))

async function fetchLessons() {
  if (!client.value) return
  loading.value = true
  try {
    lessons.value = await getLessons({ client: client.value.id })
  } finally {
    loading.value = false
  }
}

function open(value: Client) {
  client.value = value
  lessons.value = []
  visible.value = true
  fetchLessons()
}

function pay() {
  const first = lessons.value.find((l) => l.status === 'unpaid')
  if (first) payDialog.value?.open(first.id)
}

const rowClass = ({ row }: { row: Lesson }) => (row.status === 'paid' ? 'row-paid' : 'row-unpaid')

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" :title="client?.name" width="min(1000px, 96vw)" append-to-body>
    <div v-if="client" class="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
      <a v-if="client.email" :href="`mailto:${client.email}`">{{ client.email }}</a>
      <span v-if="client.phone">{{ client.phone }}</span>
      <span v-if="client.phone_2">{{ client.phone_2 }}</span>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-6">
      <span>{{ t('client.paidSum') }}: <strong>{{ paidSum }} €</strong></span>
      <span>{{ t('client.unpaidSum') }}: <strong>{{ unpaidSum }} €</strong></span>
      <el-button v-if="unpaidSum > 0" type="success" size="small" @click="pay">{{ t('lessons.pay') }}</el-button>
    </div>

    <el-table v-loading="loading" :data="lessons" row-key="id" :row-class-name="rowClass">
      <el-table-column :label="t('date')" width="110">
        <template #default="{ row }">{{ formatNiceDate(row.from) }}</template>
      </el-table-column>
      <el-table-column :label="t('hours')" width="90">
        <template #default="{ row }">{{ durationLabel(row.from, row.to) }}</template>
      </el-table-column>
      <el-table-column prop="persons_count" :label="t('persons')" width="80" />
      <el-table-column prop="name" :label="t('name')" min-width="120" />
      <el-table-column :label="t('instructorCol')" min-width="130">
        <template #default="{ row }">{{ row.instructor?.name }}</template>
      </el-table-column>
      <el-table-column :label="t('type')" width="80">
        <template #default="{ row }">
          <el-tag :type="row.type === 'ski' ? 'primary' : 'danger'" size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="note" :label="t('note')" min-width="120" />
      <el-table-column :label="t('price')" width="90" align="right">
        <template #default="{ row }">{{ row.price }} €</template>
      </el-table-column>
    </el-table>

    <LessonPayDialog ref="payDialog" @paid="fetchLessons" />
  </el-dialog>
</template>

<style>
.el-table .row-unpaid {
  --el-table-tr-bg-color: #f8dfe5;
}
.el-table .row-paid {
  --el-table-tr-bg-color: #f0f9eb;
}
</style>
