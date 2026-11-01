<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { payLessons, preparePayLesson } from '@/api/lessons'
import type { Lesson } from '@/types'
import { durationLabel, formatNiceDate } from '@/utils/date'

const emit = defineEmits<{ paid: [ids: number[]] }>()
const { t } = useI18n()

const visible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const lessons = ref<Lesson[]>([])
const selected = ref<Lesson[]>([])
const total = ref(0)
const tableRef = ref<{ toggleRowSelection: (row: any, selected?: boolean) => void }>()

const sum = computed(() => selected.value.reduce((acc, l) => acc + Number(l.price), 0))

async function open(lessonId: number) {
  visible.value = true
  loading.value = true
  lessons.value = []
  selected.value = []
  try {
    lessons.value = await preparePayLesson(lessonId)
    await nextTick()
    lessons.value.forEach((l) => tableRef.value?.toggleRowSelection(l, true))
  } catch {
    visible.value = false
  } finally {
    loading.value = false
  }
}

function onSelection(rows: Lesson[]) {
  selected.value = rows
  total.value = rows.reduce((acc, l) => acc + Number(l.price), 0)
}

/** Editing the total spreads it evenly over the selected rows (display only; the backend does the same). */
const shownPrice = (l: Lesson) => {
  if (!selected.value.some((s) => s.id === l.id) || selected.value.length === 0) return Number(l.price)
  return Math.round((total.value / selected.value.length) * 100) / 100
}

async function submit() {
  if (!selected.value.length) return
  submitting.value = true
  const ids = selected.value.map((l) => l.id)
  try {
    await payLessons(ids, total.value)
    ElMessage.success(t('messages.successPaid'))
    visible.value = false
    emit('paid', ids)
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" :title="t('pay.title')" width="min(900px, 96vw)" append-to-body>
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="lessons"
      row-key="id"
      @selection-change="onSelection"
    >
      <el-table-column type="selection" width="45" />
      <el-table-column :label="t('date')" width="110">
        <template #default="{ row }">{{ formatNiceDate(row.from) }}</template>
      </el-table-column>
      <el-table-column :label="t('lessons.duration')" width="90">
        <template #default="{ row }">{{ durationLabel(row.from, row.to) }}</template>
      </el-table-column>
      <el-table-column prop="persons_count" :label="t('persons')" width="80" />
      <el-table-column prop="name" :label="t('name')" min-width="140" />
      <el-table-column :label="t('instructorCol')" min-width="140">
        <template #default="{ row }">{{ row.instructor?.name }}</template>
      </el-table-column>
      <el-table-column :label="t('type')" width="80">
        <template #default="{ row }">
          <el-tag :type="row.type === 'ski' ? 'primary' : 'danger'" size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('price')" width="90" align="right">
        <template #default="{ row }">{{ shownPrice(row as Lesson) }} €</template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex items-center justify-end gap-3">
      <span>{{ t('pay.total') }}</span>
      <el-input-number v-model="total" :min="0" :precision="2" :step="1" :disabled="!selected.length" />
      <span class="text-gray-400 text-sm">({{ sum }} €)</span>
    </div>

    <template #footer>
      <el-button @click="visible = false">{{ t('cancel') }}</el-button>
      <el-button type="success" :loading="submitting" :disabled="!selected.length" @click="submit">
        {{ t('pay.submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
