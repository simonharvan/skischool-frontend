<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import PayoutDialog from '@/components/payouts/PayoutDialog.vue'
import { getPayouts } from '@/api/payouts'
import type { Payout } from '@/types'
import { minutesToHHMM, toBackendDate } from '@/utils/date'

const { t } = useI18n()
const router = useRouter()

const range = ref<[Date, Date]>([dayjs().startOf('month').toDate(), dayjs().endOf('month').toDate()])
const includePaid = ref(false)
const payouts = ref<Payout[]>([])
const loading = ref(false)
const dialog = ref<InstanceType<typeof PayoutDialog>>()

const rows = computed(() => payouts.value.filter((p) => p.stats.total > 0))

const params = () => ({
  includePaid: includePaid.value,
  from: toBackendDate(range.value[0]),
  to: toBackendDate(range.value[1]),
})

let seq = 0
async function load() {
  if (!range.value) return
  const mine = ++seq
  loading.value = true
  try {
    const result = await getPayouts(params())
    if (mine === seq) payouts.value = result
  } finally {
    if (mine === seq) loading.value = false
  }
}
// the one and only trigger – also runs on mount
watch([range, includePaid], load, { immediate: true })

function setMonth(base: dayjs.Dayjs) {
  range.value = [base.startOf('month').toDate(), base.endOf('month').toDate()]
}
const previousMonth = () => setMonth(dayjs(range.value[0]).subtract(1, 'month'))
const thisMonth = () => setMonth(dayjs())
const nextMonth = () => setMonth(dayjs(range.value[0]).add(1, 'month'))

function print(row: Payout) {
  router.push({ name: 'payout-print', params: { instructorId: row.instructor.id }, query: params() as any })
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <el-button @click="previousMonth">{{ t('payouts.previous') }}</el-button>
      <el-button @click="thisMonth">{{ t('payouts.this') }}</el-button>
      <el-button @click="nextMonth">{{ t('payouts.next') }}</el-button>
      <el-date-picker
        v-model="range"
        type="daterange"
        format="D.M.YYYY"
        :start-placeholder="t('from')"
        :end-placeholder="t('to')"
        :clearable="false"
      />
      <el-switch v-model="includePaid" :active-text="t('payouts.includePaid')" />
    </div>

    <el-table v-loading="loading" :data="rows" row-key="instructor.id">
      <el-table-column :label="t('name')" min-width="160" prop="instructor.name" />
      <el-table-column :label="t('email')" min-width="200" prop="instructor.email" />
      <el-table-column :label="t('payouts.hours')" width="110">
        <template #default="{ row }">{{ minutesToHHMM(row.stats.total) }}</template>
      </el-table-column>
      <el-table-column :label="t('payouts.earned')" width="140">
        <template #default="{ row }">{{ Math.round(row.stats.earned_approx * 100) / 100 }} €</template>
      </el-table-column>
      <el-table-column :label="t('actions')" width="230" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="print(row as Payout)">{{ t('payouts.printAction') }}</el-button>
          <el-button size="small" type="success" @click="dialog?.open(row as Payout)">{{ t('payouts.payOut') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <PayoutDialog ref="dialog" @paid="load" />
  </div>
</template>
