<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@element-plus/icons-vue'
import BookingDrawer from '@/components/accommodation/BookingDrawer.vue'
import { euro } from '@/components/accommodation/geometry'
import { paymentTagType } from '@/components/accommodation/payment'
import { getBookings } from '@/api/accommodation/bookings'
import { getAccStats } from '@/api/accommodation/calendar'
import { useAccommodationUnitsStore } from '@/stores/accommodationUnits'
import type { AccBooking } from '@/types/accommodation'

const PAGE_SIZE = 25
const { t } = useI18n()
const units = useAccommodationUnitsStore()

const tab = ref<'pending' | 'all'>('all')
const q = ref('')
const unitId = ref<number | undefined>()
const status = ref<string | undefined>()
const source = ref<string | undefined>()
const payment = ref<'unpaid' | 'partial' | 'paid' | 'open' | undefined>()
const range = ref<[string, string] | null>(null)
const page = ref(1)
const rows = ref<AccBooking[]>([])
const total = ref(0)
const pendingCount = ref(0)
const loading = ref(false)
const drawer = ref<InstanceType<typeof BookingDrawer>>()

let seq = 0
async function load() {
  const mine = ++seq
  loading.value = true
  try {
    const res = await getBookings({
      q: q.value || undefined,
      unit_id: unitId.value,
      status: tab.value === 'pending' ? 'pending' : status.value,
      source: source.value,
      payment: payment.value,
      from: range.value?.[0],
      to: range.value?.[1],
      page: page.value,
      per_page: PAGE_SIZE,
    })
    if (mine !== seq) return
    rows.value = res.data
    total.value = res.meta.total
  } finally {
    if (mine === seq) loading.value = false
  }
  getAccStats().then((s) => (pendingCount.value = s.pending_count)).catch(() => undefined)
}

let timer: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(() => (page.value === 1 ? load() : (page.value = 1)), 400)
})
watch([tab, unitId, status, source, payment, range], () => (page.value === 1 ? load() : (page.value = 1)))
watch(page, load)
onMounted(() => {
  units.load().catch(() => undefined)
  load()
})

const statusType = (s: string) =>
  ({ pending: 'warning', confirmed: 'primary', checked_in: 'success', checked_out: 'info', cancelled: 'danger' })[s] as any
const fmt = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)} ${s.slice(11, 16)}`
const statuses = computed(() => ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])
</script>

<template>
  <div>
    <el-tabs v-model="tab">
      <el-tab-pane name="all" :label="t('acc.allTab')" />
      <el-tab-pane name="pending">
        <template #label>
          <el-badge :value="pendingCount" :hidden="!pendingCount" :offset="[10, 2]">{{ t('acc.pendingTab') }}</el-badge>
        </template>
      </el-tab-pane>
    </el-tabs>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <el-input v-model="q" :prefix-icon="Search" :placeholder="t('acc.search')" clearable class="!w-72 max-w-full" />
      <el-select v-model="unitId" clearable :placeholder="t('acc.allUnits')" class="!w-44">
        <el-option v-for="u in units.units" :key="u.id" :label="u.name" :value="u.id" />
      </el-select>
      <el-select v-if="tab === 'all'" v-model="status" clearable :placeholder="t('acc.status')" class="!w-40">
        <el-option v-for="s in statuses" :key="s" :label="t(`acc.statuses.${s}`)" :value="s" />
      </el-select>
      <el-select v-model="source" clearable :placeholder="t('acc.source')" class="!w-36">
        <el-option v-for="s in ['backoffice', 'phone', 'email', 'web']" :key="s" :label="t(`acc.sources.${s}`)" :value="s" />
      </el-select>
      <el-select v-model="payment" clearable :placeholder="t('acc.payment')" class="!w-44">
        <el-option v-for="p in ['open', 'unpaid', 'partial', 'paid']" :key="p" :label="t(`acc.paymentStatuses.${p}`)" :value="p" />
      </el-select>
      <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" format="DD.MM.YYYY" :start-placeholder="t('from')" :end-placeholder="t('to')" class="!w-64" />
      <div class="flex-1" />
      <el-button type="primary" @click="drawer?.openNew()">+ {{ t('acc.newBooking') }}</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" @row-click="(r: any) => drawer?.openExisting(r.id)">
      <el-table-column prop="code" :label="t('acc.code')" width="130" />
      <el-table-column :label="t('acc.guest')" min-width="150">
        <template #default="{ row }">{{ row.guest?.name }}</template>
      </el-table-column>
      <el-table-column :label="t('acc.unit')" min-width="120">
        <template #default="{ row }">{{ row.unit?.name }}</template>
      </el-table-column>
      <el-table-column :label="t('acc.arrival')" min-width="140">
        <template #default="{ row }">{{ fmt(row.check_in_at) }}</template>
      </el-table-column>
      <el-table-column :label="t('acc.departure')" min-width="140">
        <template #default="{ row }">{{ fmt(row.check_out_at) }}</template>
      </el-table-column>
      <el-table-column :label="t('acc.status')" width="150">
        <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ t(`acc.statuses.${row.status}`) }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="t('acc.source')" width="110">
        <template #default="{ row }">{{ t(`acc.sources.${row.source}`) }}</template>
      </el-table-column>
      <el-table-column :label="t('acc.total')" width="100" align="right">
        <template #default="{ row }">{{ euro(row.price_total) }}</template>
      </el-table-column>
      <el-table-column :label="t('acc.payment')" min-width="160">
        <template #default="{ row }">
          <div class="flex flex-col items-start gap-0.5 py-0.5">
            <el-tag :type="paymentTagType(row.payment_status)" effect="plain" size="small">{{ t(`acc.paymentStatuses.${row.payment_status}`) }}</el-tag>
            <span v-if="row.balance > 0" class="text-xs text-red-600">{{ t('acc.balance') }} {{ euro(row.balance) }}</span>
            <span v-else-if="row.balance < 0" class="text-xs text-gray-500">{{ t('acc.overpaid') }} {{ euro(-row.balance) }}</span>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-model:current-page="page" class="mt-4" background layout="prev, pager, next" :page-size="PAGE_SIZE" :total="total" hide-on-single-page />
    <BookingDrawer ref="drawer" @saved="load" />
  </div>
</template>
