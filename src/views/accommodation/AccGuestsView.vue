<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@element-plus/icons-vue'
import BookingDrawer from '@/components/accommodation/BookingDrawer.vue'
import { euro } from '@/components/accommodation/geometry'
import { createGuest, getGuest, getGuests, updateGuest } from '@/api/accommodation/guests'
import type { AccBooking, AccGuest } from '@/types/accommodation'

const PAGE_SIZE = 25
const { t } = useI18n()

const query = ref('')
const page = ref(1)
const guests = ref<AccGuest[]>([])
const total = ref(0)
const loading = ref(false)
const bookingDrawer = ref<InstanceType<typeof BookingDrawer>>()

let seq = 0
async function load() {
  const mine = ++seq
  loading.value = true
  try {
    const res = await getGuests({ q: query.value || undefined, page: page.value, per_page: PAGE_SIZE })
    if (mine !== seq) return
    guests.value = res.data
    total.value = res.meta.total
  } finally {
    if (mine === seq) loading.value = false
  }
}
let timer: ReturnType<typeof setTimeout> | undefined
watch(query, () => {
  clearTimeout(timer)
  timer = setTimeout(() => (page.value === 1 ? load() : (page.value = 1)), 400)
})
watch(page, load)
onMounted(load)

const drawer = ref(false)
const saving = ref(false)
const history = ref<AccBooking[]>([])
const form = reactive({ id: 0, name: '', email: '', phone: '', country: '', note: '' })

async function open(g?: AccGuest) {
  Object.assign(form, { id: g?.id ?? 0, name: g?.name ?? '', email: g?.email ?? '', phone: g?.phone ?? '', country: g?.country ?? '', note: g?.note ?? '' })
  history.value = []
  drawer.value = true
  if (g) history.value = (await getGuest(g.id)).bookings ?? []
}

async function save() {
  if (!form.name) return
  saving.value = true
  try {
    const body = { name: form.name, email: form.email || null, phone: form.phone || null, country: form.country || null, note: form.note || null }
    if (form.id) await updateGuest(form.id, body)
    else await createGuest(body)
    drawer.value = false
    load()
  } catch {
    /* reported */
  } finally {
    saving.value = false
  }
}
const fmt = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap gap-2">
      <el-input v-model="query" :prefix-icon="Search" :placeholder="t('acc.search')" clearable class="!max-w-lg" />
      <div class="flex-1" />
      <el-button type="primary" @click="open()">+ {{ t('acc.guestsView.new') }}</el-button>
    </div>

    <el-table v-loading="loading" :data="guests" row-key="id" @row-click="(g: any) => open(g)">
      <el-table-column prop="name" :label="t('name')" min-width="160" />
      <el-table-column prop="email" :label="t('email')" min-width="200" />
      <el-table-column prop="phone" :label="t('phone')" min-width="130" />
      <el-table-column prop="country" :label="t('acc.guestsView.country')" width="90" />
      <el-table-column prop="bookings_count" :label="t('acc.guestsView.bookingsCount')" width="110" />
    </el-table>
    <el-pagination v-model:current-page="page" class="mt-4" background layout="prev, pager, next" :page-size="PAGE_SIZE" :total="total" hide-on-single-page />

    <el-drawer v-model="drawer" :title="form.id ? form.name : t('acc.guestsView.new')" direction="rtl" size="min(460px, 100vw)" append-to-body>
      <el-form label-position="top">
        <el-form-item :label="t('name')"><el-input v-model="form.name" /></el-form-item>
        <el-form-item :label="t('email')"><el-input v-model="form.email" type="email" /></el-form-item>
        <el-form-item :label="t('phone')"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item :label="t('acc.guestsView.country')"><el-input v-model="form.country" maxlength="2" placeholder="SK" /></el-form-item>
        <el-form-item :label="t('note')"><el-input v-model="form.note" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template v-if="history.length">
        <el-divider content-position="left">{{ t('acc.guestsView.history') }}</el-divider>
        <div v-for="b in history" :key="b.id" class="flex cursor-pointer justify-between border-b py-2 text-sm hover:bg-gray-50" @click="bookingDrawer?.openExisting(b.id)">
          <span>{{ b.code }} · {{ b.unit?.name }}<br /><span class="text-gray-400">{{ fmt(b.check_in_at) }} – {{ fmt(b.check_out_at) }}</span></span>
          <span class="text-right">{{ euro(b.price_total) }}<br /><span class="text-gray-400">{{ t(`acc.statuses.${b.status}`) }}</span></span>
        </div>
      </template>
      <template #footer>
        <el-button @click="drawer = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="save">{{ t('save') }}</el-button>
      </template>
    </el-drawer>
    <BookingDrawer ref="bookingDrawer" @saved="load" />
  </div>
</template>
