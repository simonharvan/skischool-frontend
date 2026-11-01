<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PayoutDialog from '@/components/payouts/PayoutDialog.vue'
import { getPayouts } from '@/api/payouts'
import type { Payout } from '@/types'
import { formatNiceDate, formatNiceDateTime, minutesToHHMM } from '@/utils/date'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const payout = ref<Payout | null>(null)
const loading = ref(true)
const dialog = ref<InstanceType<typeof PayoutDialog>>()

const q = computed(() => ({
  from: String(route.query.from ?? ''),
  to: String(route.query.to ?? ''),
  includePaid: route.query.includePaid === 'true',
}))

// the page loads its own data, so it also survives a hard refresh
async function load() {
  loading.value = true
  try {
    const all = await getPayouts(q.value)
    payout.value = all.find((p) => p.instructor.id === Number(route.params.instructorId)) ?? null
  } finally {
    loading.value = false
  }
}
onMounted(load)

const printPage = () => window.print()

const byPersons = computed(() =>
  payout.value
    ? ([1, 2, 3, 4] as const).map((n) => ({
        label: n === 4 ? '4+' : String(n),
        minutes: payout.value!.stats.total_by_person[`persons_${n}` as const],
      }))
    : [],
)
</script>

<template>
  <div v-loading="loading" class="print-page">
    <div class="no-print mb-4 flex gap-2">
      <el-button @click="router.back()">{{ t('back') }}</el-button>
      <el-button type="primary" @click="printPage">{{ t('print') }}</el-button>
      <el-button v-if="payout" type="success" @click="dialog?.open(payout)">{{ t('payouts.payOut') }}</el-button>
    </div>

    <template v-if="payout">
      <h2 class="mb-1 mt-0">{{ payout.instructor.name }}</h2>
      <div class="mb-4 text-gray-600">
        {{ t('payouts.period') }}: {{ formatNiceDate(q.from) }} – {{ formatNiceDate(q.to) }}
      </div>

      <div class="mb-1"><strong>{{ t('payouts.totalHours') }}:</strong> {{ minutesToHHMM(payout.stats.total) }}</div>
      <div class="mb-4">
        <strong>{{ t('payouts.byPersons') }}:</strong>
        <span v-for="b in byPersons" :key="b.label" class="ml-3">{{ b.label }}: {{ minutesToHHMM(b.minutes) }}</span>
      </div>

      <table class="lessons">
        <thead>
          <tr>
            <th>{{ t('payouts.id') }}</th>
            <th>{{ t('name') }}</th>
            <th>{{ t('from') }}</th>
            <th>{{ t('to') }}</th>
            <th>{{ t('type') }}</th>
            <th>{{ t('persons') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in payout.lessons" :key="l.id">
            <td>{{ l.id }}</td>
            <td>{{ l.name }}</td>
            <td>{{ formatNiceDateTime(l.from) }}</td>
            <td>{{ formatNiceDateTime(l.to) }}</td>
            <td>{{ l.type }}</td>
            <td>{{ l.persons_count }}</td>
          </tr>
        </tbody>
      </table>
    </template>
    <el-empty v-else-if="!loading" :description="t('noData')" />

    <PayoutDialog ref="dialog" @paid="load" />
  </div>
</template>

<style scoped>
.print-page {
  width: 740px;
  max-width: 100%;
  margin: 0 auto;
  padding: 24px 0;
  background: #fff;
  min-height: 100%;
}
.lessons {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.lessons th,
.lessons td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}
.lessons tbody tr:nth-child(odd) {
  background: #f5f5f5;
}
@media print {
  .no-print {
    display: none !important;
  }
  .print-page {
    padding: 0;
  }
}
</style>
