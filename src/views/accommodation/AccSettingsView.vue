<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import BlockDialog from '@/components/accommodation/BlockDialog.vue'
import { euro } from '@/components/accommodation/geometry'
import { createUnit, updateUnit } from '@/api/accommodation/units'
import { createRatePeriod, deleteRatePeriod, getRatePeriods, updateRatePeriod } from '@/api/accommodation/ratePeriods'
import { getBlocks } from '@/api/accommodation/blocks'
import { useAccommodationUnitsStore } from '@/stores/accommodationUnits'
import type { AccBlock, AccRatePeriod, AccUnit } from '@/types/accommodation'

const { t } = useI18n()
const store = useAccommodationUnitsStore()
const tab = ref('units')

const periods = ref<AccRatePeriod[]>([])
const blocks = ref<AccBlock[]>([])
const blockDialog = ref<InstanceType<typeof BlockDialog>>()

async function loadAll() {
  await store.load(true).catch(() => undefined)
  periods.value = await getRatePeriods()
  blocks.value = await getBlocks({ from: '2000-01-01' })
}
onMounted(loadAll)

// ---- units ----------------------------------------------------------------------------
const unitDialog = ref(false)
const unitForm = reactive({
  id: 0, name: '', slug: '', base_guests: 2, max_guests: 2, base_price: 0, extra_bed_price: 0, min_nights: 1,
  default_check_in_time: '15:00', default_check_out_time: '10:00', active: true, sort: 0,
})
const openUnit = (u?: AccUnit) => {
  Object.assign(unitForm, u ?? {
    id: 0, name: '', slug: '', base_guests: 2, max_guests: 2, base_price: 0, extra_bed_price: 0, min_nights: 1,
    default_check_in_time: '15:00', default_check_out_time: '10:00', active: true, sort: store.units.length + 1,
  })
  unitDialog.value = true
}
async function saveUnit() {
  const { id, ...body } = unitForm
  try {
    if (id) await updateUnit(id, body)
    else await createUnit(body)
    unitDialog.value = false
    await loadAll()
  } catch {
    /* reported */
  }
}

// ---- seasons --------------------------------------------------------------------------
const periodDialog = ref(false)
const periodForm = reactive({ id: 0, unit_id: null as number | null, name: '', date_from: '', date_to: '', price_per_night: 0, min_nights: null as number | null })
const openPeriod = (p?: AccRatePeriod) => {
  Object.assign(periodForm, p ?? { id: 0, unit_id: null, name: '', date_from: '', date_to: '', price_per_night: 0, min_nights: null })
  periodDialog.value = true
}
async function savePeriod() {
  const { id, ...body } = periodForm
  try {
    if (id) await updateRatePeriod(id, body)
    else await createRatePeriod(body)
    periodDialog.value = false
    await loadAll()
  } catch {
    /* reported */
  }
}
async function removePeriod(p: AccRatePeriod) {
  const ok = await ElMessageBox.confirm(t('acc.settingsView.deleteConfirm'), { type: 'warning' }).then(() => true).catch(() => false)
  if (!ok) return
  await deleteRatePeriod(p.id)
  await loadAll()
}
const unitName = (id: number | null) => (id ? (store.byId(id)?.name ?? id) : t('acc.settingsView.allUnits'))
const fmtD = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`
const fmtDT = (s: string) => `${fmtD(s)} ${s.slice(11, 16)}`
</script>

<template>
  <div>
    <el-tabs v-model="tab">
      <el-tab-pane name="units" :label="t('acc.settingsView.units')">
        <div class="mb-3 text-right"><el-button type="primary" @click="openUnit()">+ {{ t('acc.settingsView.units') }}</el-button></div>
        <el-table :data="store.units" row-key="id" @row-click="(u: any) => openUnit(u)">
          <el-table-column prop="name" :label="t('acc.settingsView.name')" min-width="140" />
          <el-table-column :label="t('acc.settingsView.baseGuests')" width="120"><template #default="{ row }">{{ row.base_guests }} / {{ row.max_guests }}</template></el-table-column>
          <el-table-column :label="t('acc.settingsView.basePrice')" width="120"><template #default="{ row }">{{ euro(row.base_price) }}</template></el-table-column>
          <el-table-column :label="t('acc.settingsView.extraBedPrice')" width="130"><template #default="{ row }">{{ euro(row.extra_bed_price) }}</template></el-table-column>
          <el-table-column prop="min_nights" :label="t('acc.settingsView.minNights')" width="100" />
          <el-table-column :label="`${t('acc.settingsView.checkInTime')} / ${t('acc.settingsView.checkOutTime')}`" width="160"><template #default="{ row }">{{ row.default_check_in_time }} / {{ row.default_check_out_time }}</template></el-table-column>
          <el-table-column :label="t('acc.settingsView.active')" width="90"><template #default="{ row }">{{ row.active ? '✓' : '–' }}</template></el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane name="seasons" :label="t('acc.settingsView.seasons')">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-500">{{ t('acc.settingsView.seasonHint') }}</span>
          <div class="flex-1" />
          <el-button type="primary" @click="openPeriod()">+ {{ t('acc.settingsView.seasons') }}</el-button>
        </div>
        <el-table :data="periods" row-key="id" @row-click="(p: any) => openPeriod(p)">
          <el-table-column prop="name" :label="t('acc.settingsView.seasonName')" min-width="140" />
          <el-table-column :label="t('acc.unit')" min-width="130"><template #default="{ row }">{{ unitName(row.unit_id) }}</template></el-table-column>
          <el-table-column :label="t('from')" width="120"><template #default="{ row }">{{ fmtD(row.date_from) }}</template></el-table-column>
          <el-table-column :label="t('to')" width="120"><template #default="{ row }">{{ fmtD(row.date_to) }}</template></el-table-column>
          <el-table-column :label="t('acc.settingsView.pricePerNight')" width="120"><template #default="{ row }">{{ euro(row.price_per_night) }}</template></el-table-column>
          <el-table-column prop="min_nights" :label="t('acc.settingsView.minNights')" width="100" />
          <el-table-column width="70"><template #default="{ row }"><el-link type="danger" :underline="false" @click.stop="removePeriod(row as AccRatePeriod)">✕</el-link></template></el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane name="blocks" :label="t('acc.settingsView.blocks')">
        <div class="mb-3 text-right"><el-button type="primary" @click="blockDialog?.open()">+ {{ t('acc.newBlock') }}</el-button></div>
        <el-table :data="blocks" row-key="id" @row-click="(b: any) => blockDialog?.open(b)">
          <el-table-column :label="t('acc.unit')" min-width="130"><template #default="{ row }">{{ unitName(row.unit_id) }}</template></el-table-column>
          <el-table-column :label="t('acc.settingsView.startsAt')" min-width="150"><template #default="{ row }">{{ fmtDT(row.starts_at) }}</template></el-table-column>
          <el-table-column :label="t('acc.settingsView.endsAt')" min-width="150"><template #default="{ row }">{{ fmtDT(row.ends_at) }}</template></el-table-column>
          <el-table-column prop="reason" :label="t('acc.settingsView.reason')" min-width="160" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <BlockDialog ref="blockDialog" @saved="loadAll" />

    <el-dialog v-model="unitDialog" :title="t('acc.settingsView.units')" width="min(520px, 94vw)" append-to-body>
      <el-form label-position="top">
        <div class="grid grid-cols-2 gap-x-3">
          <el-form-item :label="t('acc.settingsView.name')"><el-input v-model="unitForm.name" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.slug')"><el-input v-model="unitForm.slug" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.baseGuests')"><el-input-number v-model="unitForm.base_guests" :min="1" class="!w-full" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.maxGuests')"><el-input-number v-model="unitForm.max_guests" :min="1" class="!w-full" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.basePrice')"><el-input-number v-model="unitForm.base_price" :min="0" :precision="2" class="!w-full" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.extraBedPrice')"><el-input-number v-model="unitForm.extra_bed_price" :min="0" :precision="2" class="!w-full" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.minNights')"><el-input-number v-model="unitForm.min_nights" :min="1" class="!w-full" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.active')"><el-switch v-model="unitForm.active" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.checkInTime')"><el-time-select v-model="unitForm.default_check_in_time" start="00:00" end="23:30" step="00:30" class="!w-full" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.checkOutTime')"><el-time-select v-model="unitForm.default_check_out_time" start="00:00" end="23:30" step="00:30" class="!w-full" /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="unitDialog = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" @click="saveUnit">{{ t('save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="periodDialog" :title="t('acc.settingsView.seasons')" width="min(480px, 94vw)" append-to-body>
      <el-form label-position="top">
        <el-form-item :label="t('acc.settingsView.seasonName')"><el-input v-model="periodForm.name" /></el-form-item>
        <el-form-item :label="t('acc.unit')">
          <el-select v-model="periodForm.unit_id" clearable :placeholder="t('acc.settingsView.allUnits')" class="w-full">
            <el-option v-for="u in store.units" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <div class="grid grid-cols-2 gap-x-3">
          <el-form-item :label="t('acc.settingsView.dateFrom')"><el-date-picker v-model="periodForm.date_from" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" class="!w-full" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.dateTo')"><el-date-picker v-model="periodForm.date_to" type="date" value-format="YYYY-MM-DD" format="DD.MM.YYYY" class="!w-full" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.pricePerNight')"><el-input-number v-model="periodForm.price_per_night" :min="0" :precision="2" class="!w-full" /></el-form-item>
          <el-form-item :label="t('acc.settingsView.minNights')"><el-input-number v-model="periodForm.min_nights" :min="1" class="!w-full" /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="periodDialog = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" @click="savePeriod">{{ t('save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
