<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { bulkCreateAttendance, bulkDeleteAttendance, getAttendance } from '@/api/attendance'
import { PLACEHOLDER_INSTRUCTOR_EMAIL, useInstructorsStore } from '@/stores/instructors'
import { atMinutes, toBackendDate, toBackendDateTime } from '@/utils/date'

const { t } = useI18n()
const instructors = useInstructorsStore()

const date = ref(new Date())
const present = ref<number[]>([])
const loading = ref(false)
const saving = ref(false)

const list = computed(() => instructors.all.filter((i) => i.email !== PLACEHOLDER_INSTRUCTOR_EMAIL))
const weekday = computed(() => dayjs(date.value).format('dddd'))

let seq = 0
async function load() {
  const mine = ++seq
  loading.value = true
  try {
    const result = await getAttendance(toBackendDate(date.value))
    if (mine === seq) present.value = result.map((a) => a.instructor?.id).filter((id): id is number => !!id)
  } finally {
    if (mine === seq) loading.value = false
  }
}
watch(date, load)
onMounted(load)

function shift(days: number) {
  date.value = dayjs(date.value).add(days, 'day').toDate()
}

async function save() {
  saving.value = true
  const day = toBackendDate(date.value)
  const checked = list.value.filter((i) => present.value.includes(i.id)).map((i) => i.id)
  const unchecked = list.value.filter((i) => !present.value.includes(i.id)).map((i) => i.id)
  try {
    if (checked.length) {
      await bulkCreateAttendance(
        checked,
        toBackendDateTime(atMinutes(day, 8 * 60 + 30)),
        toBackendDateTime(atMinutes(day, 16 * 60)),
      )
    }
    if (unchecked.length) await bulkDeleteAttendance(unchecked, day)
    ElMessage.success(t('attendance.saved'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-xl">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <el-button @click="shift(-1)">{{ t('previous') }}</el-button>
      <el-button @click="date = new Date()">{{ t('lessons.today') }}</el-button>
      <el-button @click="shift(1)">{{ t('next') }}</el-button>
      <el-date-picker v-model="date" type="date" format="D.M.YYYY" :clearable="false" class="!w-40" />
      <span class="font-medium capitalize">{{ weekday }}</span>
    </div>

    <el-table v-loading="loading" :data="list" row-key="id">
      <el-table-column :label="t('attendance.present')" width="110">
        <template #default="{ row }">
          <el-checkbox
            :model-value="present.includes(row.id)"
            @change="(v: any) => (present = v ? [...present, row.id] : present.filter((id) => id !== row.id))"
          />
        </template>
      </el-table-column>
      <el-table-column prop="name" :label="t('name')" />
    </el-table>

    <el-button type="primary" class="mt-4" :loading="saving" @click="save">{{ t('save') }}</el-button>
  </div>
</template>
