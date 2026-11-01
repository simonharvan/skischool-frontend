<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { Refresh } from '@element-plus/icons-vue'
import DayTimeline, {
  type TimelineChange,
  type TimelineEntry,
  type TimelineSelection,
} from '@/components/timeline/DayTimeline.vue'
import LessonEditDrawer from '@/components/lessons/LessonEditDrawer.vue'
import LessonPayDialog from '@/components/lessons/LessonPayDialog.vue'
import { getInstructors } from '@/api/instructors'
import { getLessons, updateLesson } from '@/api/lessons'
import { useLessonsStore } from '@/stores/lessons'
import type { Instructor, Lesson } from '@/types'
import { atMinutes, minutesOfDay, roundToHalfHour, toBackendDate, toBackendDateTime } from '@/utils/date'

const DAY_START = 8 * 60 + 30
const DAY_END = 16 * 60

const { t } = useI18n()
const store = useLessonsStore()

const rows = ref<Instructor[]>([])
const lessons = ref<Lesson[]>([])
const loading = ref(false)
const selection = ref<TimelineSelection | null>(null)
const drawer = ref<InstanceType<typeof LessonEditDrawer>>()
const payDialog = ref<InstanceType<typeof LessonPayDialog>>()

const date = computed({
  get: () => dayjs(store.selectedDate).toDate(),
  set: (v: Date | null) => v && store.setDate(v),
})

const timelineRows = computed(() => rows.value.map((i) => ({ id: i.id, label: i.name })))

const items = computed<TimelineEntry[]>(() =>
  lessons.value
    .filter((l) => l.instructor && l.client)
    .map((l) => ({
      id: l.id,
      rowId: l.instructor!.id,
      start: minutesOfDay(l.from),
      end: minutesOfDay(l.to),
      label: l.client!.phone ? `${l.name} (${l.client!.phone})` : l.name,
      cls: [
        l.is_time_off ? 'timeoff' : l.type,
        ...(l.status === 'paid' && !l.is_time_off ? ['paid'] : []),
      ],
    })),
)

let fetchSeq = 0
async function fetchData() {
  const seq = ++fetchSeq
  const day = store.selectedDate
  loading.value = true
  try {
    const [r, l] = await Promise.all([
      getInstructors({ date: day }),
      getLessons({ date: day }),
    ])
    if (seq !== fetchSeq) return
    rows.value = r
    lessons.value = l
  } finally {
    if (seq === fetchSeq) loading.value = false
  }
}

watch(
  () => store.selectedDate,
  () => {
    selection.value = null
    fetchData()
  },
)
onMounted(fetchData)

const isToday = computed(() => store.selectedDate === toBackendDate(new Date()))
const isYesterday = computed(() => store.selectedDate === toBackendDate(dayjs().subtract(1, 'day')))
const isTomorrow = computed(() => store.selectedDate === toBackendDate(dayjs().add(1, 'day')))

async function onChange(change: TimelineChange) {
  const lesson = lessons.value.find((l) => l.id === change.id)
  if (!lesson) return
  const before = { from: lesson.from, to: lesson.to, instructor: lesson.instructor }
  const instructor = rows.value.find((r) => r.id === change.rowId)

  // optimistic
  lesson.from = toBackendDateTime(atMinutes(lesson.from, change.start))
  lesson.to = toBackendDateTime(atMinutes(lesson.to, change.end))
  if (instructor) lesson.instructor = instructor

  try {
    await updateLesson(lesson.id, {
      id: lesson.id,
      from: lesson.from,
      to: lesson.to,
      price: lesson.price,
      name: lesson.name,
      type: lesson.type,
      note: lesson.note,
      persons_count: lesson.persons_count,
      instructor_id: change.rowId,
    })
    ElMessage.success({ message: t('messages.successUpdate'), duration: 2000 })
  } catch {
    Object.assign(lesson, before)
  }
}

function onItemClick(id: number) {
  const lesson = lessons.value.find((l) => l.id === id)
  if (lesson) drawer.value?.open(lesson)
}

function newLesson(range?: TimelineSelection | null) {
  const day = dayjs(store.selectedDate)
  if (range) {
    drawer.value?.open({
      id: -1,
      from: toBackendDateTime(atMinutes(day, range.start)),
      to: toBackendDateTime(atMinutes(day, range.end)),
      instructor: { id: range.rowId } as Instructor,
      type: 'ski',
      persons_count: 1,
      price: 20,
    } as Lesson)
    return
  }
  // now + 1 hour, rounded; kept inside the visible window of the selected day
  const start = Math.min(
    Math.max(minutesOfDay(roundToHalfHour(dayjs().add(1, 'hour'))), DAY_START),
    DAY_END - 60,
  )
  drawer.value?.open({
    id: -1,
    from: toBackendDateTime(atMinutes(day, start)),
    to: toBackendDateTime(atMinutes(day, start + 60)),
    type: 'ski',
    persons_count: 1,
    price: 20,
  } as Lesson)
}

function onSaved() {
  selection.value = null
  fetchData()
}

function onCreate(range: TimelineSelection) {
  newLesson(range)
}

function onPay(lesson: Lesson) {
  payDialog.value?.open(lesson.id)
}

function onPaid(ids: number[]) {
  lessons.value.forEach((l) => {
    if (ids.includes(l.id)) l.status = 'paid'
  })
}
</script>

<template>
  <div class="lessons">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <el-button-group>
        <el-button :type="isYesterday ? 'primary' : 'default'" @click="store.shift(-1)">
          {{ t('lessons.yesterday') }}
        </el-button>
        <el-button :type="isToday ? 'primary' : 'default'" @click="store.setDate(new Date())">
          {{ t('lessons.today') }}
        </el-button>
        <el-button :type="isTomorrow ? 'primary' : 'default'" @click="store.shift(1)">
          {{ t('lessons.tomorrow') }}
        </el-button>
      </el-button-group>
      <el-date-picker v-model="date" type="date" format="D.M.YYYY" :clearable="false" class="!w-40" />
      <el-button type="primary" @click="newLesson(selection)">{{ t('lessons.newLesson') }}</el-button>
      <el-button :icon="Refresh" :loading="loading" circle :title="t('refresh')" @click="fetchData" />
    </div>

    <DayTimeline
      v-model:selection="selection"
      :rows="timelineRows"
      :items="items"
      :day-start="DAY_START"
      :day-end="DAY_END"
      :row-header="t('lessons.instructor')"
      @change="onChange"
      @item-click="onItemClick"
      @create="onCreate"
    />

    <LessonEditDrawer ref="drawer" @saved="onSaved" @deleted="fetchData" @pay="onPay" />
    <LessonPayDialog ref="payDialog" @paid="onPaid" />
  </div>
</template>

<style scoped>
.lessons :deep(.dt-item.ski) {
  background: #158abe;
}
.lessons :deep(.dt-item.snb) {
  background: #64073d;
}
.lessons :deep(.dt-item.paid) {
  background: #94c23e;
  border-color: #5c7d1d;
  box-shadow: 0 0 5px rgba(50, 50, 50, 1);
}
.lessons :deep(.dt-item.timeoff) {
  background: repeating-linear-gradient(-55deg, #7a7a7a 0 10px, #6e6e6e 10px 20px);
  border-color: #444;
  color: #fff;
}
</style>
