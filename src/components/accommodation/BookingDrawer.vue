<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { paymentTagType } from '@/components/accommodation/payment'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import {
  addAdjustment,
  addPayment,
  bookingAction,
  createBooking,
  deleteAdjustment,
  deletePayment,
  getBooking,
  payBookings,
  preparePay,
  quote as fetchQuote,
  updateBooking,
} from '@/api/accommodation/bookings'
import { getGuests } from '@/api/accommodation/guests'
import { useAccommodationUnitsStore } from '@/stores/accommodationUnits'
import type {
  AccBooking,
  AccBookingPayload,
  AccBreakdownLine,
  AccCurrentQuote,
  AccGuest,
  AccQuote,
  BookingSource,
  PaymentMethod,
} from '@/types/accommodation'
import { euro, nightsBetween } from './geometry'

const emit = defineEmits<{ saved: [] }>()
const { t } = useI18n()
const units = useAccommodationUnitsStore()

const visible = ref(false)
const saving = ref(false)
const booking = ref<AccBooking | null>(null)
const currentQuote = ref<AccCurrentQuote | null>(null)

const isNew = computed(() => !booking.value)
const editable = computed(() => isNew.value || ['pending', 'confirmed', 'checked_in'].includes(booking.value!.status))

const blank = () => ({
  unit_id: 0,
  inDate: '',
  inTime: '15:00',
  outDate: '',
  outTime: '10:00',
  adults: 2,
  children: 0,
  extra_bed: false,
  source: 'phone' as BookingSource,
  status: 'confirmed' as 'pending' | 'confirmed',
  guestKey: null as number | string | null,
  newGuest: { email: '', phone: '' },
  deposit_amount: 0,
  note: '',
  internal_note: '',
})
const form = reactive(blank())
/** adjustments entered before the booking exists */
const draftAdjustments = ref<{ label: string; amount: number }[]>([])

const guestOptions = ref<AccGuest[]>([])
const loadingGuests = ref(false)
const selectedGuest = computed(() =>
  typeof form.guestKey === 'number' ? guestOptions.value.find((g) => g.id === form.guestKey) : undefined,
)

let guestSeq = 0
async function searchGuests(q: string) {
  const mine = ++guestSeq
  loadingGuests.value = true
  try {
    const res = await getGuests({ q: q || undefined, per_page: 20 })
    if (mine !== guestSeq) return
    const keep = selectedGuest.value ? [selectedGuest.value] : []
    guestOptions.value = [...keep, ...res.data.filter((g) => !keep.some((k) => k.id === g.id))]
  } finally {
    if (mine === guestSeq) loadingGuests.value = false
  }
}

const checkInAt = computed(() => (form.inDate ? `${form.inDate}T${form.inTime}:00` : ''))
const checkOutAt = computed(() => (form.outDate ? `${form.outDate}T${form.outTime}:00` : ''))
const nights = computed(() => (checkInAt.value && checkOutAt.value ? nightsBetween(checkInAt.value, checkOutAt.value) : 0))

// ---- live quote -------------------------------------------------------------------------
const quote = ref<AccQuote | null>(null)
let quoteSeq = 0
let quoteTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => [form.unit_id, checkInAt.value, checkOutAt.value, form.adults, form.children, form.extra_bed],
  () => {
    clearTimeout(quoteTimer)
    if (!visible.value || !form.unit_id || !checkInAt.value || !checkOutAt.value || checkOutAt.value <= checkInAt.value) {
      quote.value = null
      return
    }
    quoteTimer = setTimeout(async () => {
      const mine = ++quoteSeq
      try {
        const q = await fetchQuote({
          unit_id: form.unit_id,
          check_in_at: checkInAt.value,
          check_out_at: checkOutAt.value,
          adults: form.adults,
          children: form.children,
          extra_bed: form.extra_bed,
          booking_id: booking.value?.id,
        })
        if (mine === quoteSeq) quote.value = q
      } catch {
        if (mine === quoteSeq) quote.value = null
      }
    }, 250)
  },
)

/** consecutive nights with the same rate become one line: "3 × 149 € (Zimná)" */
const groupLines = (lines: AccBreakdownLine[]) => {
  const out: { n: number; rate: number; label: string | null }[] = []
  for (const l of lines) {
    const last = out[out.length - 1]
    if (last && last.rate === l.rate && last.label === l.label) last.n++
    else out.push({ n: 1, rate: l.rate, label: l.label })
  }
  return out
}
const quoteLines = computed(() => groupLines(quote.value?.breakdown ?? []))
const bedLine = computed(() => {
  const q = quote.value
  if (!q || !q.extra_bed || q.extra_bed_total <= 0) return ''
  return t('acc.extraBedLine', { n: q.nights, price: euro(q.extra_bed_total / q.nights) })
})

/** has the stay (and so the price) been edited since the booking was loaded? */
const stayEdited = computed(() => {
  const b = booking.value
  if (!b) return false
  return (
    b.unit_id !== form.unit_id ||
    b.check_in_at.slice(0, 16) !== `${form.inDate}T${form.inTime}` ||
    b.check_out_at.slice(0, 16) !== `${form.outDate}T${form.outTime}` ||
    b.adults + b.children !== form.adults + form.children ||
    b.extra_bed !== form.extra_bed
  )
})

const adjustmentsTotal = computed(() =>
  isNew.value
    ? draftAdjustments.value.reduce((s, a) => s + a.amount, 0)
    : (booking.value?.adjustments ?? []).reduce((s, a) => s + a.amount, 0),
)
const calculated = computed(() => (isNew.value || stayEdited.value ? (quote.value?.total ?? 0) : booking.value!.price_calculated))
const total = computed(() => (isNew.value ? calculated.value + adjustmentsTotal.value : booking.value!.price_total))
const paid = computed(() => booking.value?.paid ?? 0)
const balance = computed(() => Math.round((total.value - paid.value) * 100) / 100)

const issues = computed(() => {
  const q = quote.value
  if (!q) return [] as string[]
  const list = [...q.violations]
  if (q.available === false && q.conflict) list.push(t('acc.conflict', { label: q.conflict.label }))
  return list
})

// ---- open / load ------------------------------------------------------------------------
function applyBooking(b: AccBooking, cq?: AccCurrentQuote) {
  booking.value = b
  currentQuote.value = cq ?? null
  Object.assign(form, {
    unit_id: b.unit_id,
    inDate: b.check_in_at.slice(0, 10),
    inTime: b.check_in_at.slice(11, 16),
    outDate: b.check_out_at.slice(0, 10),
    outTime: b.check_out_at.slice(11, 16),
    adults: b.adults,
    children: b.children,
    extra_bed: b.extra_bed,
    source: b.source,
    guestKey: b.guest_id,
    deposit_amount: b.deposit_amount,
    note: b.note ?? '',
    internal_note: b.internal_note ?? '',
  })
  if (b.guest) guestOptions.value = [b.guest]
}

async function openNew(prefill: { unit_id?: number; checkIn?: string; checkOut?: string } = {}) {
  await units.load().catch(() => undefined)
  booking.value = null
  currentQuote.value = null
  draftAdjustments.value = []
  quote.value = null
  Object.assign(form, blank())
  const unit = units.byId(prefill.unit_id) ?? units.units.find((u) => u.active) ?? units.units[0]
  form.unit_id = unit?.id ?? 0
  form.inTime = unit?.default_check_in_time ?? '15:00'
  form.outTime = unit?.default_check_out_time ?? '10:00'
  if (prefill.checkIn) {
    form.inDate = prefill.checkIn.slice(0, 10)
    form.inTime = prefill.checkIn.slice(11, 16)
  }
  if (prefill.checkOut) {
    form.outDate = prefill.checkOut.slice(0, 10)
    form.outTime = prefill.checkOut.slice(11, 16)
  }
  guestOptions.value = []
  visible.value = true
  searchGuests('').catch(() => undefined)
  nudgeQuote()
}

async function openExisting(id: number) {
  await units.load().catch(() => undefined)
  const res = await getBooking(id)
  draftAdjustments.value = []
  quote.value = null
  applyBooking(res.data, res.current_quote)
  visible.value = true
  searchGuests('').catch(() => undefined)
  nudgeQuote()
}

/** the quote watcher only fires on change; poke it after (re)filling the form */
function nudgeQuote() {
  clearTimeout(quoteTimer)
  quoteTimer = setTimeout(async () => {
    if (!form.unit_id || !checkInAt.value || !checkOutAt.value || checkOutAt.value <= checkInAt.value) return
    const mine = ++quoteSeq
    try {
      const q = await fetchQuote({
        unit_id: form.unit_id,
        check_in_at: checkInAt.value,
        check_out_at: checkOutAt.value,
        adults: form.adults,
        children: form.children,
        extra_bed: form.extra_bed,
        booking_id: booking.value?.id,
      })
      if (mine === quoteSeq) quote.value = q
    } catch {
      /* the form still works without a live quote */
    }
  }, 50)
}

function onUnitChange(id: number) {
  const u = units.byId(id)
  if (u && isNew.value) {
    form.inTime = u.default_check_in_time
    form.outTime = u.default_check_out_time
  }
}

// first night -> default checkout the next day
watch(
  () => form.inDate,
  (d, old) => {
    if (!d || !isNew.value) return
    if (!form.outDate || form.outDate <= d || (old && nightsBetween(`${old}`, form.outDate) === 1)) {
      const next = new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
      form.outDate = next
    }
  },
)

// ---- save -------------------------------------------------------------------------------
const canSave = computed(
  () => editable.value && !!form.unit_id && !!form.inDate && !!form.outDate && form.guestKey !== null && form.guestKey !== '',
)

function payload(): AccBookingPayload {
  const p: AccBookingPayload = {
    unit_id: form.unit_id,
    check_in_at: checkInAt.value,
    check_out_at: checkOutAt.value,
    adults: form.adults,
    children: form.children,
    extra_bed: form.extra_bed,
    source: form.source,
    deposit_amount: form.deposit_amount || 0,
    note: form.note || null,
    internal_note: form.internal_note || null,
  }
  if (typeof form.guestKey === 'number') p.guest_id = form.guestKey
  else if (isNew.value) p.guest = { name: String(form.guestKey), email: form.newGuest.email || null, phone: form.newGuest.phone || null }
  return p
}

async function save() {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    if (isNew.value) {
      const body: any = { ...payload(), status: form.status }
      if (draftAdjustments.value.length) body.adjustments = draftAdjustments.value
      const res = await createBooking(body)
      ElMessage.success(t('acc.createdBooking'))
      emit('saved')
      applyBooking(res.data, res.current_quote)
    } else {
      const res = await updateBooking(booking.value!.id, payload())
      ElMessage.success(t('acc.savedBooking'))
      emit('saved')
      applyBooking(res.data, res.current_quote)
      nudgeQuote()
    }
  } catch {
    /* reported by the http client (overlaps arrive as 422 with the conflict named) */
  } finally {
    saving.value = false
  }
}

async function run(action: 'confirm' | 'cancel' | 'check-in' | 'check-out') {
  if (!booking.value) return
  if (action === 'cancel') {
    const ok = await ElMessageBox.confirm(t('acc.cancelConfirm'), { type: 'warning' }).then(() => true).catch(() => false)
    if (!ok) return
  }
  try {
    const res = await bookingAction(booking.value.id, action)
    applyBooking(res.data, res.current_quote)
    emit('saved')
  } catch {
    /* reported */
  }
}

async function usePrice(use: boolean) {
  if (!use) {
    currentQuote.value = null
    return
  }
  const res = await bookingAction(booking.value!.id, 'reprice')
  ElMessage.success(t('acc.repriced'))
  applyBooking(res.data, res.current_quote)
  emit('saved')
}

// ---- adjustments & payments -------------------------------------------------------------
const adjDialog = ref(false)
// a discount/surcharge is entered as the new total price; the stored adjustment is the difference
const adj = reactive({ label: '', newPrice: null as number | null, amount: null as number | null })
const priceDiff = (newPrice: number | null) =>
  newPrice === null ? null : Math.round((newPrice - total.value) * 100) / 100 || null
watch(() => adj.newPrice, (v) => (adj.amount = priceDiff(v)))
function openAdjustment() {
  Object.assign(adj, { label: '', newPrice: total.value, amount: null })
  adjDialog.value = true
}
async function saveAdjustment() {
  if (!adj.label || !adj.amount) return
  if (isNew.value) {
    draftAdjustments.value.push({ label: adj.label, amount: adj.amount })
    adjDialog.value = false
    return
  }
  const res = await addAdjustment(booking.value!.id, { label: adj.label, amount: adj.amount })
  applyBooking(res.data, currentQuote.value ?? undefined)
  adjDialog.value = false
  emit('saved')
}
async function removeAdjustment(id: number) {
  const res = await deleteAdjustment(id)
  applyBooking(res.data, currentQuote.value ?? undefined)
  emit('saved')
}

const payDialog = ref(false)
const pay = reactive({ amount: null as number | null, method: 'cash' as PaymentMethod, note: '', withAdj: false, adjLabel: '', adjNewPrice: null as number | null, adjAmount: null as number | null })
// with a new price the payment defaults to what is left of that price
watch(
  () => [pay.withAdj, pay.adjNewPrice] as const,
  ([withAdj, newPrice]) => {
    pay.adjAmount = withAdj ? priceDiff(newPrice) : null
    const owed = Math.round(((withAdj && newPrice !== null ? newPrice : total.value) - paid.value) * 100) / 100
    pay.amount = owed > 0 ? owed : null
  },
)
// like lessons: paying offers every booking of the same guest that still owes money
const openBookings = ref<AccBooking[]>([])
const selectedBookings = ref<AccBooking[]>([])
const loadingOpen = ref(false)
const openTable = ref<{ toggleRowSelection: (row: any, selected?: boolean) => void }>()
const showOpenTable = computed(() => openBookings.value.some((b) => b.id !== booking.value?.id))
/** Several bookings (or one other than this) selected: each gets its full balance paid. */
const multiPay = computed(
  () => showOpenTable.value && !(selectedBookings.value.length === 1 && selectedBookings.value[0].id === booking.value?.id),
)
const selectedBalance = computed(() => Math.round(selectedBookings.value.reduce((s, b) => s + b.balance, 0) * 100) / 100)

async function openPayment() {
  Object.assign(pay, { amount: balance.value > 0 ? balance.value : null, method: 'cash', note: '', withAdj: false, adjLabel: '', adjNewPrice: total.value, adjAmount: null })
  openBookings.value = []
  selectedBookings.value = []
  payDialog.value = true
  loadingOpen.value = true
  try {
    openBookings.value = await preparePay(booking.value!.id)
    await nextTick()
    openBookings.value.forEach((b) => openTable.value?.toggleRowSelection(b, true))
  } catch {
    openBookings.value = []
  } finally {
    loadingOpen.value = false
  }
}
function onOpenSelection(rows: AccBooking[]) {
  selectedBookings.value = rows
  if (!multiPay.value) pay.amount = balance.value > 0 ? balance.value : null
}
async function savePayment() {
  if (multiPay.value) {
    if (!selectedBookings.value.length) return
    const updated = await payBookings({
      booking_ids: selectedBookings.value.map((b) => b.id),
      method: pay.method,
      note: pay.note || undefined,
    })
    const mine = updated.find((b) => b.id === booking.value!.id)
    if (mine) applyBooking((await getBooking(mine.id)).data, currentQuote.value ?? undefined)
    payDialog.value = false
    emit('saved')
    return
  }
  if (!pay.amount) return
  const body: any = { amount: pay.amount, method: pay.method, note: pay.note || undefined }
  if (pay.withAdj && pay.adjLabel && pay.adjAmount) body.adjustment = { label: pay.adjLabel, amount: pay.adjAmount }
  const res = await addPayment(booking.value!.id, body)
  applyBooking(res.data, currentQuote.value ?? undefined)
  payDialog.value = false
  emit('saved')
}
async function removePayment(id: number) {
  const res = await deletePayment(id)
  applyBooking(res.data, currentQuote.value ?? undefined)
  emit('saved')
}

const statusType = (s: string) =>
  ({ pending: 'warning', confirmed: 'primary', checked_in: 'success', checked_out: 'info', cancelled: 'danger' })[s] as any
const fmtDT = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}. ${s.slice(11, 16)}`
const sources: BookingSource[] = ['backoffice', 'phone', 'email', 'web']
const methods: PaymentMethod[] = ['cash', 'transfer', 'card']

defineExpose({ openNew, openExisting })
</script>

<template>
  <el-drawer
    v-model="visible"
    direction="rtl"
    size="min(560px, 100vw)"
    append-to-body
    :title="isNew ? t('acc.newBookingTitle') : t('acc.bookingTitle', { code: booking!.code })"
  >
    <template v-if="!isNew" #header>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-base font-medium">{{ t('acc.bookingTitle', { code: booking!.code }) }}</span>
        <el-tag :type="statusType(booking!.status)">{{ t(`acc.statuses.${booking!.status}`) }}</el-tag>
        <el-tag :type="paymentTagType(booking!.payment_status)" effect="plain" data-test="payment-status">{{ t(`acc.paymentStatuses.${booking!.payment_status}`) }}</el-tag>
      </div>
    </template>

    <div v-if="!isNew" class="mb-4 flex flex-wrap gap-2">
      <el-button v-if="booking!.status === 'pending'" type="primary" size="small" @click="run('confirm')">{{ t('acc.confirmAction') }}</el-button>
      <el-button v-if="booking!.status === 'confirmed'" type="success" size="small" @click="run('check-in')">{{ t('acc.checkIn') }}</el-button>
      <el-button v-if="booking!.status === 'checked_in'" type="success" size="small" @click="run('check-out')">{{ t('acc.checkOut') }}</el-button>
      <el-button v-if="['pending', 'confirmed'].includes(booking!.status)" type="danger" plain size="small" @click="run('cancel')">{{ t('acc.cancelBooking') }}</el-button>
    </div>

    <el-form label-position="top" :disabled="!editable" @submit.prevent="save">
      <el-form-item :label="t('acc.unit')">
        <el-select v-model="form.unit_id" class="w-full" @change="onUnitChange">
          <el-option v-for="u in units.units" :key="u.id" :label="u.name" :value="u.id" :disabled="!u.active && u.id !== form.unit_id" />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('acc.arrival')">
        <div class="flex w-full gap-2">
          <el-date-picker v-model="form.inDate" type="date" format="DD.MM.YYYY" value-format="YYYY-MM-DD" :clearable="false" class="!min-w-0 !flex-1" data-test="in-date" />
          <el-time-select v-model="form.inTime" start="00:00" end="23:45" step="00:15" :clearable="false" class="!w-28" />
        </div>
      </el-form-item>
      <el-form-item :label="t('acc.departure')">
        <div class="flex w-full gap-2">
          <el-date-picker v-model="form.outDate" type="date" format="DD.MM.YYYY" value-format="YYYY-MM-DD" :clearable="false" class="!min-w-0 !flex-1" data-test="out-date" />
          <el-time-select v-model="form.outTime" start="00:00" end="23:45" step="00:15" :clearable="false" class="!w-28" />
        </div>
      </el-form-item>
      <div v-if="nights > 0" class="-mt-2 mb-3 text-sm text-gray-500" data-test="nights">{{ t('acc.nightsN', { n: nights }) }}</div>

      <el-alert v-for="(m, i) in issues" :key="i" :title="m" type="error" :closable="false" show-icon class="mb-2" />
      <el-alert
        v-if="quote && issues.length === 0 && quote.available"
        :title="t('acc.available')"
        type="success"
        :closable="false"
        show-icon
        class="mb-3"
      />

      <div class="grid grid-cols-3 items-end gap-x-3">
        <el-form-item :label="t('acc.adults')"><el-input-number v-model="form.adults" :min="1" :max="20" class="!w-full" controls-position="right" /></el-form-item>
        <el-form-item :label="t('acc.children')"><el-input-number v-model="form.children" :min="0" :max="20" class="!w-full" controls-position="right" /></el-form-item>
        <el-form-item><el-checkbox v-model="form.extra_bed" :label="t('acc.extraBed')" /></el-form-item>
      </div>

      <el-form-item :label="t('acc.guest')">
        <el-select
          v-model="form.guestKey"
          filterable
          remote
          allow-create
          default-first-option
          reserve-keyword
          :remote-method="searchGuests"
          :loading="loadingGuests"
          :placeholder="t('acc.guestSearch')"
          class="w-full"
          :disabled="!isNew && !editable"
        >
          <el-option v-for="g in guestOptions" :key="g.id" :label="g.name" :value="g.id">
            <span>{{ g.name }}</span>
            <span class="ml-2 text-xs text-gray-400">{{ g.email || g.phone }}</span>
          </el-option>
        </el-select>
      </el-form-item>
      <div v-if="typeof form.guestKey === 'string' && form.guestKey" class="grid grid-cols-2 gap-x-3">
        <el-form-item :label="t('email')"><el-input v-model="form.newGuest.email" type="email" /></el-form-item>
        <el-form-item :label="t('phone')"><el-input v-model="form.newGuest.phone" /></el-form-item>
      </div>
      <div v-else-if="selectedGuest" class="-mt-2 mb-3 text-sm text-gray-500">
        <span v-if="selectedGuest.email">✉ {{ selectedGuest.email }}</span>
        <span v-if="selectedGuest.phone" class="ml-3">☎ {{ selectedGuest.phone }}</span>
      </div>

      <div class="grid grid-cols-2 gap-x-3">
        <el-form-item :label="t('acc.source')">
          <el-select v-model="form.source" class="w-full">
            <el-option v-for="s in sources" :key="s" :label="t(`acc.sources.${s}`)" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isNew" :label="t('acc.status')">
          <el-select v-model="form.status" class="w-full">
            <el-option value="confirmed" :label="t('acc.statuses.confirmed')" />
            <el-option value="pending" :label="t('acc.statuses.pending')" />
          </el-select>
        </el-form-item>
      </div>

      <!-- price -->
      <el-divider content-position="left">{{ t('acc.price') }}</el-divider>
      <div class="price-box" data-test="price">
        <template v-if="quote">
          <div v-for="(l, i) in quoteLines" :key="i" class="flex justify-between">
            <span>{{ l.n }} × {{ euro(l.rate) }}<span v-if="l.label" class="text-gray-400"> ({{ l.label }})</span></span>
            <span>{{ euro(l.n * l.rate) }}</span>
          </div>
          <div v-if="bedLine" class="flex justify-between">
            <span>{{ bedLine }}</span><span>{{ euro(quote.extra_bed_total) }}</span>
          </div>
        </template>
        <div class="flex justify-between font-medium">
          <span>{{ t('acc.calculated') }}</span><span>{{ euro(calculated) }}</span>
        </div>

        <el-alert
          v-if="!isNew && !stayEdited && currentQuote?.differs"
          type="warning"
          :closable="false"
          class="my-2"
        >
          <div>{{ t('acc.newPrice', { new: euro(currentQuote.total), old: euro(booking!.price_calculated) }) }}</div>
          <div class="mt-2 flex gap-2">
            <el-button size="small" type="primary" @click="usePrice(true)">{{ t('acc.useNewPrice') }}</el-button>
            <el-button size="small" @click="usePrice(false)">{{ t('acc.keepOldPrice') }}</el-button>
          </div>
        </el-alert>
        <div v-if="!isNew && stayEdited && quote && Math.abs(quote.total - booking!.price_calculated) > 0.004" class="text-sm text-amber-600">
          {{ t('acc.newPrice', { new: euro(quote.total), old: euro(booking!.price_calculated) }) }}
        </div>

        <template v-if="isNew">
          <div v-for="(a, i) in draftAdjustments" :key="i" class="flex items-center justify-between">
            <span>{{ a.label }}</span>
            <span>{{ euro(a.amount) }} <el-link type="danger" :underline="false" @click="draftAdjustments.splice(i, 1)">✕</el-link></span>
          </div>
        </template>
        <template v-else>
          <div v-for="a in booking!.adjustments" :key="a.id" class="flex items-center justify-between" :title="a.created_by_name || ''">
            <span>{{ a.label }}</span>
            <span>{{ euro(a.amount) }} <el-link v-if="editable" type="danger" :underline="false" @click="removeAdjustment(a.id)">✕</el-link></span>
          </div>
        </template>
        <el-button v-if="editable" size="small" class="my-2" @click="openAdjustment">+ {{ t('acc.addAdjustment') }}</el-button>

        <div class="flex justify-between border-t pt-2 text-base font-semibold" data-test="total">
          <span>{{ t('acc.total') }}</span><span>{{ euro(total) }}</span>
        </div>
        <template v-if="!isNew">
          <div v-for="p in booking!.payments" :key="p.id" class="flex items-center justify-between text-sm text-gray-600">
            <span>{{ fmtDT(p.paid_at) }} · {{ t(`acc.methods.${p.method}`) }}<span v-if="p.note"> · {{ p.note }}</span></span>
            <span>{{ euro(p.amount) }} <el-link type="danger" :underline="false" @click="removePayment(p.id)">✕</el-link></span>
          </div>
          <div class="flex justify-between"><span>{{ t('acc.paid') }}</span><span>{{ euro(paid) }}</span></div>
          <div class="flex items-center justify-between font-medium" data-test="balance">
            <span>{{ balance < 0 ? t('acc.refund') : t('acc.balance') }}</span>
            <span :class="balance > 0 ? 'text-red-600' : balance < 0 ? 'text-amber-600' : 'text-green-600'">{{ euro(Math.abs(balance)) }}</span>
          </div>
          <el-button size="small" type="primary" class="mt-2" @click="openPayment">+ {{ t('acc.addPayment') }}</el-button>
        </template>
        <el-form-item :label="t('acc.deposit')" class="mt-3">
          <el-input-number v-model="form.deposit_amount" :min="0" :precision="2" :step="10" controls-position="right" />
        </el-form-item>
      </div>

      <el-form-item :label="t('acc.noteGuest')" class="mt-4"><el-input v-model="form.note" type="textarea" :rows="2" /></el-form-item>
      <el-form-item :label="t('acc.noteInternal')"><el-input v-model="form.internal_note" type="textarea" :rows="2" /></el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">{{ t('acc.close') }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!canSave || issues.length > 0" data-test="save" @click="save">{{ t('save') }}</el-button>
    </template>

    <el-dialog v-model="adjDialog" :title="t('acc.addAdjustment')" width="min(400px, 94vw)" append-to-body>
      <el-form label-position="top">
        <el-form-item :label="t('acc.adjustmentLabel')"><el-input v-model="adj.label" placeholder="Zľava stály hosť" /></el-form-item>
        <el-form-item :label="t('acc.adjustedPrice')">
          <el-input-number v-model="adj.newPrice" :min="0" :precision="2" :step="5" class="!w-full" data-test="adj-new-price" />
          <div class="text-xs text-gray-500" data-test="adj-diff">{{ euro(total) }} → {{ adj.amount ? `${adj.amount > 0 ? '+' : '−'}${euro(Math.abs(adj.amount))}` : t('acc.noChange') }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjDialog = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" :disabled="!adj.label || !adj.amount" @click="saveAdjustment">{{ t('save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="payDialog" :title="t('acc.addPayment')" :width="showOpenTable ? 'min(720px, 96vw)' : 'min(400px, 94vw)'" append-to-body>
      <div v-if="showOpenTable" class="mb-4" data-test="open-bookings">
        <div class="mb-1 text-sm font-medium">{{ t('acc.guestOpenBookings') }}</div>
        <el-table ref="openTable" v-loading="loadingOpen" :data="openBookings" row-key="id" size="small" @selection-change="onOpenSelection">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="code" :label="t('acc.code')" width="110" />
          <el-table-column :label="t('acc.unit')" min-width="120">
            <template #default="{ row }">{{ row.unit?.name }}</template>
          </el-table-column>
          <el-table-column :label="t('acc.stay')" min-width="150">
            <template #default="{ row }">{{ fmtDT(row.check_in_at).slice(0, 6) }} – {{ fmtDT(row.check_out_at).slice(0, 6) }}</template>
          </el-table-column>
          <el-table-column :label="t('acc.balance')" width="100" align="right">
            <template #default="{ row }">{{ euro(row.balance) }}</template>
          </el-table-column>
        </el-table>
      </div>
      <el-form label-position="top">
        <el-form-item v-if="multiPay" :label="t('acc.payAmount')">
          <div>
            <div class="text-base font-semibold" data-test="pay-multi-total">{{ euro(selectedBalance) }}</div>
            <div class="text-xs text-gray-500">{{ t('acc.payFullBalances') }}</div>
          </div>
        </el-form-item>
        <el-form-item v-else :label="t('acc.payAmount')"><el-input-number v-model="pay.amount" :precision="2" :step="10" class="!w-full" data-test="pay-amount" /></el-form-item>
        <el-form-item :label="t('acc.payMethod')">
          <el-select v-model="pay.method" class="w-full">
            <el-option v-for="m in methods" :key="m" :label="t(`acc.methods.${m}`)" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('note')"><el-input v-model="pay.note" /></el-form-item>
        <el-checkbox v-if="!multiPay" v-model="pay.withAdj" :label="t('acc.withAdjustment')" />
        <template v-if="pay.withAdj && !multiPay">
          <el-form-item :label="t('acc.adjustmentLabel')" class="mt-2"><el-input v-model="pay.adjLabel" /></el-form-item>
          <el-form-item :label="t('acc.adjustedPrice')">
            <el-input-number v-model="pay.adjNewPrice" :min="0" :precision="2" :step="5" class="!w-full" />
            <div class="text-xs text-gray-500">{{ euro(total) }} → {{ pay.adjAmount ? `${pay.adjAmount > 0 ? '+' : '−'}${euro(Math.abs(pay.adjAmount))}` : t('acc.noChange') }}</div>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="payDialog = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" :disabled="multiPay ? !selectedBookings.length : !pay.amount" data-test="pay-save" @click="savePayment">{{ t('save') }}</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<style scoped>
.price-box {
  font-size: 14px;
  line-height: 1.7;
}
</style>
