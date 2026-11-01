<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { sendPayout } from '@/api/payouts'
import { instructorPayoutPerHour } from '@/config/pricing'
import type { Lesson, Payout } from '@/types'
import { durationHours, durationLabel, formatNiceDateTime, minutesToHHMM } from '@/utils/date'

const emit = defineEmits<{ paid: [] }>()
const { t } = useI18n()

const visible = ref(false)
const submitting = ref(false)
const payout = ref<Payout | null>(null)
const selected = ref<Lesson[]>([])
const amount = ref(0)
const tableRef = ref<{ toggleRowSelection: (row: any, selected?: boolean) => void }>()

const selectedMinutes = computed(() =>
  selected.value.reduce((acc, l) => acc + durationHours(l.from, l.to) * 60, 0),
)

async function open(value: Payout) {
  payout.value = value
  selected.value = []
  amount.value = 0
  visible.value = true
  await nextTick()
  value.lessons.forEach((l) => tableRef.value?.toggleRowSelection(l, true))
}

function onSelection(rows: Lesson[]) {
  selected.value = rows
  const hours = rows.reduce((acc, l) => acc + durationHours(l.from, l.to), 0)
  amount.value = Math.round(hours * instructorPayoutPerHour * 100) / 100
}

async function submit() {
  if (!payout.value || !selected.value.length) return
  submitting.value = true
  try {
    await sendPayout(
      selected.value.map((l) => l.id),
      amount.value,
      payout.value.instructor.id,
    )
    ElMessage.success(t('payouts.paidOut'))
    visible.value = false
    emit('paid')
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" :title="`${t('payouts.payoutTitle')}: ${payout?.instructor.name ?? ''}`" width="min(800px, 96vw)" append-to-body>
    <el-table ref="tableRef" :data="payout?.lessons ?? []" row-key="id" @selection-change="onSelection">
      <el-table-column type="selection" width="45" />
      <el-table-column prop="id" :label="t('payouts.id')" width="70" />
      <el-table-column prop="name" :label="t('name')" min-width="140" />
      <el-table-column :label="t('from')" min-width="140">
        <template #default="{ row }">{{ formatNiceDateTime(row.from) }}</template>
      </el-table-column>
      <el-table-column :label="t('lessons.duration')" width="90">
        <template #default="{ row }">{{ durationLabel(row.from, row.to) }}</template>
      </el-table-column>
      <el-table-column prop="persons_count" :label="t('persons')" width="80" />
    </el-table>

    <div class="mt-4 flex flex-wrap items-center justify-end gap-3">
      <span class="text-sm text-gray-500">{{ t('payouts.selectedHours') }}: {{ minutesToHHMM(selectedMinutes) }}</span>
      <span>{{ t('payouts.amount') }}</span>
      <el-input-number v-model="amount" :min="0" :precision="2" :step="1" :disabled="!selected.length" />
    </div>

    <template #footer>
      <el-button @click="visible = false">{{ t('cancel') }}</el-button>
      <el-button type="success" :loading="submitting" :disabled="!selected.length" @click="submit">
        {{ t('payouts.payOut') }}
      </el-button>
    </template>
  </el-dialog>
</template>
