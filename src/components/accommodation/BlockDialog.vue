<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { createBlock, deleteBlock, updateBlock } from '@/api/accommodation/blocks'
import { useAccommodationUnitsStore } from '@/stores/accommodationUnits'
import type { AccBlock } from '@/types/accommodation'

const emit = defineEmits<{ saved: [] }>()
const { t } = useI18n()
const units = useAccommodationUnitsStore()

const visible = ref(false)
const saving = ref(false)
const form = reactive({ id: 0, unit_id: 0, starts_at: '', ends_at: '', reason: '' })

async function open(block?: Partial<AccBlock>) {
  await units.load().catch(() => undefined)
  const first = units.units[0]
  Object.assign(form, {
    id: block?.id ?? 0,
    unit_id: block?.unit_id ?? first?.id ?? 0,
    starts_at: block?.starts_at ?? '',
    ends_at: block?.ends_at ?? '',
    reason: block?.reason ?? '',
  })
  visible.value = true
}

async function save() {
  if (!form.unit_id || !form.starts_at || !form.ends_at) return
  saving.value = true
  try {
    const payload = { unit_id: form.unit_id, starts_at: form.starts_at, ends_at: form.ends_at, reason: form.reason || null }
    if (form.id) await updateBlock(form.id, payload)
    else await createBlock(payload)
    visible.value = false
    emit('saved')
  } catch {
    /* reported by the http client */
  } finally {
    saving.value = false
  }
}

async function remove() {
  const ok = await ElMessageBox.confirm(t('acc.settingsView.deleteConfirm'), { type: 'warning' }).then(() => true).catch(() => false)
  if (!ok) return
  await deleteBlock(form.id)
  visible.value = false
  emit('saved')
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" :title="t('acc.settingsView.blocks')" width="min(440px, 94vw)" append-to-body>
    <el-form label-position="top">
      <el-form-item :label="t('acc.unit')">
        <el-select v-model="form.unit_id" class="w-full">
          <el-option v-for="u in units.units" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('acc.settingsView.startsAt')">
        <el-date-picker v-model="form.starts_at" type="datetime" format="DD.MM.YYYY HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" class="!w-full" />
      </el-form-item>
      <el-form-item :label="t('acc.settingsView.endsAt')">
        <el-date-picker v-model="form.ends_at" type="datetime" format="DD.MM.YYYY HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" class="!w-full" />
      </el-form-item>
      <el-form-item :label="t('acc.settingsView.reason')">
        <el-input v-model="form.reason" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button v-if="form.id" type="danger" plain class="float-left" @click="remove">{{ t('delete') }}</el-button>
      <el-button @click="visible = false">{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ t('save') }}</el-button>
    </template>
  </el-dialog>
</template>
