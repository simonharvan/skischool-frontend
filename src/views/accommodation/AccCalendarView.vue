<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import BookingDrawer from '@/components/accommodation/BookingDrawer.vue'
import BlockDialog from '@/components/accommodation/BlockDialog.vue'
import { getCalendar } from '@/api/accommodation/calendar'
import { useAccommodationUnitsStore } from '@/stores/accommodationUnits'
import type { AccBlock, AccBooking, AccUnit } from '@/types/accommodation'
import {
  addDays,
  barRect,
  dayNumber,
  daysInMonth,
  nightsToStay,
  occupiedNights,
  selectNights,
  timeToMinutes,
  toFractionalDay,
  xToDayIndex,
  euro,
} from '@/components/accommodation/geometry'
import { PAYMENT_STATUSES, paymentIcon } from '@/components/accommodation/payment'
import type { PaymentStatus } from '@/types/accommodation'

const { t } = useI18n()
const unitsStore = useAccommodationUnitsStore()

const month = ref(dayjs().startOf('month'))
const units = ref<AccUnit[]>([])
const bookings = ref<AccBooking[]>([])
const blocks = ref<AccBlock[]>([])
const loading = ref(false)
const drawer = ref<InstanceType<typeof BookingDrawer>>()
const blockDialog = ref<InstanceType<typeof BlockDialog>>()

const narrow = ref(window.innerWidth < 700)
const onResize = () => (narrow.value = window.innerWidth < 700)
const dayWidth = computed(() => (narrow.value ? 46 : 62))
const labelWidth = computed(() => (narrow.value ? 84 : 128))

const rangeStartDate = computed(() => month.value.format('YYYY-MM-DD'))
const rangeStartDay = computed(() => dayNumber(rangeStartDate.value))
const rangeDays = computed(() => daysInMonth(month.value.year(), month.value.month() + 1))
const trackWidth = computed(() => rangeDays.value * dayWidth.value)
const todayDate = dayjs().format('YYYY-MM-DD')

const days = computed(() =>
  Array.from({ length: rangeDays.value }, (_, i) => {
    const d = dayjs(addDays(rangeStartDate.value, i))
    return { date: d.format('YYYY-MM-DD'), n: d.date(), wd: d.format('dd'), weekend: d.day() === 0 || d.day() === 6 }
  }),
)

let seq = 0
async function load() {
  const mine = ++seq
  loading.value = true
  try {
    await unitsStore.load().catch(() => undefined)
    const to = month.value.add(1, 'month').format('YYYY-MM-DD')
    const res = await getCalendar(rangeStartDate.value, to)
    if (mine !== seq) return
    units.value = res.units
    bookings.value = res.bookings
    blocks.value = res.blocks
  } finally {
    if (mine === seq) loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  load()
})
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

const shift = (n: number) => {
  month.value = month.value.add(n, 'month')
  load()
}
const goToday = () => {
  month.value = dayjs().startOf('month')
  load()
}

interface Bar {
  key: string
  kind: 'booking' | 'block'
  id: number
  left: number
  width: number
  status: string
  payment?: PaymentStatus
  label: string
  title: string
  clippedStart: boolean
  clippedEnd: boolean
}

const fmt = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}. ${s.slice(11, 16)}`

const rows = computed(() =>
  units.value.map((unit) => {
    const bars: Bar[] = []
    for (const b of bookings.value.filter((x) => x.unit_id === unit.id)) {
      const r = barRect(b.check_in_at, b.check_out_at, rangeStartDay.value, rangeDays.value, dayWidth.value)
      if (!r) continue
      const guests = b.adults + b.children
      const name = b.guest?.name ?? b.code
      bars.push({
        key: `b${b.id}`, kind: 'booking', id: b.id, ...r, status: b.status, payment: b.payment_status,
        label: `${name} (${guests}${b.extra_bed ? '+1' : ''})`,
        title: `${b.code} · ${name}\n${fmt(b.check_in_at)} → ${fmt(b.check_out_at)}\n${t(`acc.statuses.${b.status}`)} · ${t(`acc.paymentStatuses.${b.payment_status}`)}: ${euro(b.paid)} / ${euro(b.price_total)}`,
        clippedStart: r.clippedStart, clippedEnd: r.clippedEnd,
      })
    }
    for (const bl of blocks.value.filter((x) => x.unit_id === unit.id)) {
      const r = barRect(bl.starts_at, bl.ends_at, rangeStartDay.value, rangeDays.value, dayWidth.value)
      if (!r) continue
      bars.push({
        key: `k${bl.id}`, kind: 'block', id: bl.id, ...r, status: 'block',
        label: bl.reason || t('acc.legendBlocked'),
        title: `${bl.reason || t('acc.legendBlocked')}\n${fmt(bl.starts_at)} → ${fmt(bl.ends_at)}`,
        clippedStart: r.clippedStart, clippedEnd: r.clippedEnd,
      })
    }
    const inMin = timeToMinutes(unit.default_check_in_time)
    const outMin = timeToMinutes(unit.default_check_out_time)
    const occupied = occupiedNights(
      [
        ...bookings.value.filter((x) => x.unit_id === unit.id).map((x) => ({ start: x.check_in_at, end: x.check_out_at })),
        ...blocks.value.filter((x) => x.unit_id === unit.id).map((x) => ({ start: x.starts_at, end: x.ends_at })),
      ],
      rangeStartDay.value, rangeDays.value, inMin, outMin,
    )
    return { unit, bars, occupied, inMin, outMin }
  }),
)

// ---- drag to create -------------------------------------------------------------------------
const drag = ref<{ unitId: number; anchor: number; current: number; moved: boolean; touch: boolean; x0: number } | null>(null)

const selection = computed(() => {
  const d = drag.value
  if (!d) return null
  const row = rows.value.find((r) => r.unit.id === d.unitId)
  if (!row) return null
  const sel = selectNights(d.anchor, d.current, row.occupied)
  if (!sel) return null
  return { unitId: d.unitId, ...sel, row }
})

const selectionStyle = (r: { unit: AccUnit }) => {
  const s = selection.value
  if (!s || s.unitId !== r.unit.id) return null
  const W = dayWidth.value
  const left = (s.from + s.row.inMin / 1440) * W
  const right = (s.to + 1 + s.row.outMin / 1440) * W
  return { left: `${left}px`, width: `${right - left}px` }
}

function localX(e: PointerEvent): number {
  return e.clientX - (e.currentTarget as HTMLElement).getBoundingClientRect().left
}

function onDown(e: PointerEvent, unitId: number) {
  if (e.button !== 0) return
  const idx = xToDayIndex(localX(e), dayWidth.value, rangeDays.value)
  drag.value = { unitId, anchor: idx, current: idx, moved: false, touch: e.pointerType === 'touch', x0: e.clientX }
  if (e.pointerType !== 'touch') (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onMove(e: PointerEvent) {
  const d = drag.value
  if (!d) return
  if (Math.abs(e.clientX - d.x0) > 4) d.moved = true
  d.current = xToDayIndex(localX(e), dayWidth.value, rangeDays.value)
}

function onUp() {
  const d = drag.value
  const sel = selection.value
  drag.value = null
  if (!d || !sel) return
  // on touch screens a swipe is a scroll, only a tap creates a (one night) booking
  const { checkIn, checkOut } = nightsToStay(sel.from, sel.to, rangeStartDay.value, minToTime(sel.row.inMin), minToTime(sel.row.outMin))
  drawer.value?.openNew({ unit_id: sel.unitId, checkIn, checkOut })
}
const minToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

function openBar(bar: Bar) {
  if (bar.kind === 'booking') drawer.value?.openExisting(bar.id)
  else blockDialog.value?.open(blocks.value.find((b) => b.id === bar.id))
}

const nowX = computed(() => {
  const nowFrac = toFractionalDay(dayjs().format('YYYY-MM-DDTHH:mm:00')) - rangeStartDay.value
  return nowFrac >= 0 && nowFrac <= rangeDays.value ? nowFrac * dayWidth.value : null
})

const legend = ['confirmed', 'pending', 'checked_in', 'checked_out'] as const
</script>

<template>
  <div class="acc-cal">
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <el-button :icon="ArrowLeft" circle size="small" data-test="prev" @click="shift(-1)" />
      <h2 class="m-0 min-w-[9rem] text-center text-base font-medium" data-test="month">{{ month.format('MMMM YYYY') }}</h2>
      <el-button :icon="ArrowRight" circle size="small" data-test="next" @click="shift(1)" />
      <el-button size="small" @click="goToday">{{ t('acc.today') }}</el-button>
      <div class="flex-1" />
      <el-button size="small" @click="blockDialog?.open()">+ {{ t('acc.newBlock') }}</el-button>
      <el-button type="primary" size="small" data-test="new-booking" @click="drawer?.openNew()">+ {{ t('acc.newBooking') }}</el-button>
    </div>

    <div v-loading="loading" class="cal-scroll">
      <div :style="{ width: `${labelWidth + trackWidth}px` }" class="cal-grid">
        <div class="cal-row cal-head">
          <div class="cal-label" :style="{ width: `${labelWidth}px` }" />
          <div class="flex" :style="{ width: `${trackWidth}px` }">
            <div
              v-for="d in days"
              :key="d.date"
              class="cal-day"
              :class="{ weekend: d.weekend, today: d.date === todayDate }"
              :style="{ width: `${dayWidth}px` }"
            >
              <span class="text-[10px] uppercase text-gray-400">{{ d.wd }}</span>
              <span class="font-medium">{{ d.n }}</span>
            </div>
          </div>
        </div>

        <div v-for="r in rows" :key="r.unit.id" class="cal-row" :data-unit="r.unit.id">
          <div class="cal-label" :style="{ width: `${labelWidth}px` }">{{ r.unit.name }}</div>
          <div
            class="cal-track"
            :style="{ width: `${trackWidth}px`, '--w': `${dayWidth}px` }"
            @pointerdown.self="onDown($event, r.unit.id)"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="drag = null"
          >
            <div v-for="d in days" :key="d.date" class="cal-bg" :class="{ weekend: d.weekend, today: d.date === todayDate }" :style="{ left: `${days.indexOf(d) * dayWidth}px`, width: `${dayWidth}px` }" />
            <div v-if="nowX !== null" class="cal-now" :style="{ left: `${nowX}px` }" />
            <div v-if="selectionStyle(r)" class="cal-sel" :style="selectionStyle(r)!" />
            <button
              v-for="b in r.bars"
              :key="b.key"
              type="button"
              class="cal-bar"
              :class="[`st-${b.status}`, { cs: b.clippedStart, ce: b.clippedEnd }]"
              :style="{ left: `${b.left}px`, width: `${b.width}px` }"
              :title="b.title"
              :data-bar="b.key"
              @click="openBar(b)"
            >
              <span v-if="b.payment" class="pay-dot" :class="`pay-${b.payment}`" :data-pay="b.payment">{{ paymentIcon(b.payment) }}</span>{{ b.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
      <span v-for="s in legend" :key="s" class="flex items-center gap-1"><i class="swatch" :class="`st-${s}`" />{{ t(`acc.statuses.${s}`) }}</span>
      <span class="flex items-center gap-1"><i class="swatch st-block" />{{ t('acc.legendBlocked') }}</span>
      <span class="legend-sep" />
      <span v-for="p in PAYMENT_STATUSES" :key="p" class="flex items-center gap-1"><i class="pay-dot" :class="`pay-${p}`">{{ paymentIcon(p) }}</i>{{ t(`acc.paymentStatuses.${p}`) }}</span>
    </div>

    <BookingDrawer ref="drawer" @saved="load" />
    <BlockDialog ref="blockDialog" @saved="load" />
  </div>
</template>

<style scoped>
.cal-scroll {
  overflow: auto;
  max-width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}
.cal-grid {
  min-width: 100%;
}
.cal-row {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}
.cal-row:last-child {
  border-bottom: none;
}
.cal-label {
  position: sticky;
  left: 0;
  z-index: 5;
  flex: none;
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 13px;
  font-weight: 500;
  background: #fff;
  border-right: 1px solid #e5e7eb;
}
.cal-head .cal-label {
  height: 40px;
}
.cal-day {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-size: 12px;
  border-right: 1px solid #f0f0f0;
  box-sizing: border-box;
}
.cal-day.weekend,
.cal-bg.weekend {
  background: #f7f8fa;
}
.cal-day.today,
.cal-bg.today {
  background: #e8f3ff;
}
.cal-track {
  position: relative;
  flex: none;
  height: 60px;
  cursor: crosshair;
  touch-action: pan-x pan-y;
  user-select: none;
}
.cal-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  border-right: 1px solid #f0f0f0;
  pointer-events: none;
  box-sizing: border-box;
}
.cal-now {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #f4516c;
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
}
.cal-sel {
  position: absolute;
  top: 6px;
  bottom: 6px;
  border: 2px dashed #409eff;
  background: rgba(64, 158, 255, 0.15);
  border-radius: 6px;
  pointer-events: none;
  z-index: 2;
}
.cal-bar {
  position: absolute;
  top: 10px;
  height: 40px;
  z-index: 3;
  padding: 0 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #fff;
  text-align: left;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  box-sizing: border-box;
}
.cal-bar.cs {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.cal-bar.ce {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.st-confirmed {
  background: #409eff;
}
.st-pending {
  background: repeating-linear-gradient(45deg, #f5a623, #f5a623 6px, #f7bb55 6px, #f7bb55 12px);
}
.st-checked_in {
  background: #2f9e6f;
}
.st-checked_out {
  background: #9aa4b2;
}
.st-block {
  color: #444;
  background: repeating-linear-gradient(135deg, #d9dce1, #d9dce1 6px, #eceef1 6px, #eceef1 12px);
}
.pay-dot {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 5px;
  border: 1.5px solid #fff;
  border-radius: 50%;
  font-size: 10px;
  font-style: normal;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  vertical-align: -3px;
}
.pay-paid {
  background: #15803d;
}
.pay-partial {
  background: #d97706;
}
.pay-unpaid {
  background: #dc2626;
}
.legend-sep {
  width: 1px;
  align-self: stretch;
  background: #d1d5db;
}
.swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
}
</style>
