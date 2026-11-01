<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { getInstructorsStats, getStats } from '@/api/stats'
import type { InstructorStats, Stats } from '@/types'
import { minutesToHHMM, toBackendDate } from '@/utils/date'

use([BarChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const { t } = useI18n()

const dates = ref<[Date, Date]>([dayjs().subtract(30, 'day').startOf('day').toDate(), dayjs().endOf('day').toDate()])
const stats = ref<Stats | null>(null)
const instructorStats = ref<InstructorStats[]>([])
const loading = ref(false)

const shortcuts = computed(() => [
  { text: t('dashboard.lastWeek'), value: () => [dayjs().subtract(7, 'day').toDate(), dayjs().toDate()] },
  {
    text: t('dashboard.previousMonth'),
    value: () => {
      const start = dayjs().subtract(1, 'month').startOf('month')
      return [start.toDate(), start.endOf('month').toDate()]
    },
  },
  {
    text: t('dashboard.thisMonth'),
    value: () => [dayjs().startOf('month').toDate(), dayjs().endOf('month').toDate()],
  },
  {
    text: t('dashboard.twoMonths'),
    value: () => [dayjs().subtract(1, 'month').startOf('month').toDate(), dayjs().endOf('month').toDate()],
  },
])

let seq = 0
async function load() {
  if (!dates.value) return
  const mine = ++seq
  loading.value = true
  const params = { from: toBackendDate(dates.value[0]), to: toBackendDate(dates.value[1]) }
  try {
    const [s, i] = await Promise.all([getStats(params), getInstructorsStats(params)])
    if (mine !== seq) return
    stats.value = s
    instructorStats.value = i
  } finally {
    if (mine === seq) loading.value = false
  }
}
watch(dates, load)
onMounted(load)

const cards = computed(() => [
  { label: t('dashboard.newClients'), value: String(stats.value?.clients ?? 0), color: '#40c9c6' },
  { label: t('dashboard.duration'), value: minutesToHHMM(stats.value?.duration ?? 0), color: '#36a3f7' },
  {
    label: `${t('dashboard.unpaid')} / ${t('dashboard.paid')}`,
    value: `${stats.value?.unpaid ?? 0} € / ${stats.value?.paid ?? 0} €`,
    color: '#f4516c',
  },
  {
    label: t('dashboard.bestInstructor'),
    value: stats.value?.best_instructor
      ? `${stats.value.best_instructor} (${minutesToHHMM(stats.value.best_instructor_duration)})`
      : '–',
    color: '#34bfa3',
  },
])

const option = computed(() => {
  const names = instructorStats.value.map((s) => s.name)
  const hours = (key: 'persons_1' | 'persons_2' | 'persons_3' | 'persons_4') =>
    instructorStats.value.map((s) => Math.round((s.duration_by_persons[key] / 60) * 100) / 100)
  const bar = (key: 'persons_1' | 'persons_2' | 'persons_3' | 'persons_4') => ({
    name: t(`dashboard.${key}`),
    type: 'bar' as const,
    stack: 'hours',
    data: hours(key),
  })
  return {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    legend: { top: 0 },
    grid: { left: 40, right: 50, bottom: 30, top: 40, containLabel: true },
    xAxis: { type: 'category' as const, data: names, axisLabel: { interval: 0, rotate: names.length > 8 ? 30 : 0 } },
    yAxis: [
      { type: 'value' as const, name: t('dashboard.hoursAxis'), axisTick: { show: false } },
      { type: 'value' as const, name: '€', axisTick: { show: false }, splitLine: { show: false } },
    ],
    series: [
      bar('persons_1'),
      bar('persons_2'),
      bar('persons_3'),
      bar('persons_4'),
      {
        name: t('dashboard.totalValue'),
        type: 'bar' as const,
        stack: 'total',
        yAxisIndex: 1,
        data: instructorStats.value.map((s) => s.total),
      },
    ],
  }
})
</script>

<template>
  <div>
    <el-date-picker
      v-model="dates"
      type="daterange"
      format="D.M.YYYY"
      :start-placeholder="t('dashboard.rangeFrom')"
      :end-placeholder="t('dashboard.rangeTo')"
      :range-separator="t('dashboard.rangeSeparator')"
      :shortcuts="shortcuts"
      :clearable="false"
    />

    <div v-loading="loading" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="c in cards" :key="c.label" class="rounded bg-white p-4 shadow-sm">
        <div class="text-sm text-gray-500">{{ c.label }}</div>
        <div class="mt-2 text-2xl font-semibold" :style="{ color: c.color }">{{ c.value }}</div>
      </div>
    </div>

    <div class="mt-4 rounded bg-white p-4 shadow-sm">
      <v-chart :option="option" autoresize style="height: 380px" />
    </div>

    <h3 class="mb-2 mt-6 text-base font-medium">{{ t('dashboard.weather') }}</h3>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="rounded bg-white p-2 shadow-sm">
        <div class="mb-1 text-sm text-gray-500">{{ t('dashboard.weatherOscadnica') }}</div>
        <img class="w-full" src="https://www.yr.no/en/content/2-12057247/meteogram.svg" alt="yr.no Oščadnica" />
      </div>
      <div class="rounded bg-white p-2 shadow-sm">
        <div class="mb-1 text-sm text-gray-500">{{ t('dashboard.weatherVelkaRaca') }}</div>
        <img class="w-full" src="https://www.yr.no/en/content/2-12212485/meteogram.svg" alt="yr.no Veľká Rača" />
      </div>
    </div>
  </div>
</template>
