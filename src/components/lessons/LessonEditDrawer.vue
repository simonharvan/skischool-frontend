<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { type FormInstance, type FormRules } from 'element-plus'
import { getClients } from '@/api/clients'
import { createLesson, deleteLesson, updateLesson } from '@/api/lessons'
import { durationToPrice } from '@/config/pricing'
import { useInstructorsStore } from '@/stores/instructors'
import type { Client, Lesson, LessonPayload } from '@/types'
import { toBackendDateTime } from '@/utils/date'

const emit = defineEmits<{ saved: []; deleted: [id: number]; pay: [lesson: Lesson] }>()

const { t } = useI18n()
const instructors = useInstructorsStore()

const visible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const blank = () => ({
  id: -1,
  status: 'unpaid' as 'paid' | 'unpaid',
  date: dayjs().format('YYYY-MM-DD'),
  startTime: '09:00',
  endTime: '10:00',
  name: '',
  type: 'ski' as 'ski' | 'snb',
  price: 20,
  persons_count: 1,
  instructor_id: null as number | null,
  /** existing client id, or the typed name of a new one */
  clientKey: null as number | string | null,
  client: { name: '', email: '', phone: '', phone_2: '' },
  note: '',
  is_time_off: false,
  wasTimeOff: false,
})
const form = reactive(blank())

const clientOptions = ref<Client[]>([])
const loadingClients = ref(false)
const isNew = computed(() => form.id < 0)
const isPaid = computed(() => form.status === 'paid')
const existingClient = computed(() =>
  typeof form.clientKey === 'number' ? clientOptions.value.find((c) => c.id === form.clientKey) : undefined,
)
const needsClient = computed(() => !form.is_time_off && (isNew.value || form.wasTimeOff))
const showClientFields = computed(() => needsClient.value && form.clientKey !== null)

const timeOptions = (from: number, to: number, extra: string) => {
  const list: string[] = []
  for (let m = from; m <= to; m += 30) {
    list.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  }
  if (extra && !list.includes(extra)) list.push(extra)
  return list.sort()
}
const startOptions = computed(() => timeOptions(8 * 60 + 30, 15 * 60 + 30, form.startTime))
const endOptions = computed(() => timeOptions(9 * 60, 16 * 60, form.endTime))

const instant = (time: string) => dayjs(`${form.date} ${time}`)

const rules = computed<FormRules>(() => ({
  instructor_id: [{ required: true, message: t('lessons.instructorRequired'), trigger: 'change' }],
  clientKey: [
    {
      validator: (_r, value, cb) =>
        needsClient.value && (value === null || value === '') ? cb(new Error(t('lessons.clientRequired'))) : cb(),
      trigger: 'change',
    },
  ],
  endTime: [
    {
      validator: (_r, _v, cb) =>
        instant(form.endTime).isAfter(instant(form.startTime)) ? cb() : cb(new Error(t('lessons.endAfterStart'))),
      trigger: 'change',
    },
  ],
  'client.email': [
    {
      validator: (_r, value: string, cb) =>
        !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? cb() : cb(new Error(t('lessons.emailInvalid'))),
      trigger: 'blur',
    },
  ],
}))

function setFrom(lesson: Partial<Lesson> & { instructor?: { id: number } | null }) {
  Object.assign(form, blank())
  const from = dayjs(lesson.from)
  const to = dayjs(lesson.to)
  form.id = lesson.id ?? -1
  form.status = lesson.status ?? 'unpaid'
  form.date = from.format('YYYY-MM-DD')
  form.startTime = from.format('HH:mm')
  form.endTime = to.format('HH:mm')
  form.name = lesson.name ?? ''
  form.type = lesson.type ?? 'ski'
  form.price = lesson.price ?? 20
  form.persons_count = lesson.persons_count ?? 1
  form.instructor_id = lesson.instructor?.id && lesson.instructor.id > 0 ? lesson.instructor.id : null
  form.note = lesson.note ?? ''
  form.is_time_off = !!lesson.is_time_off
  form.wasTimeOff = !!lesson.is_time_off
  clientOptions.value = []
  if (lesson.client && !lesson.is_time_off) {
    clientOptions.value = [lesson.client as Client]
    form.clientKey = lesson.client.id
    Object.assign(form.client, {
      name: lesson.client.name,
      email: lesson.client.email ?? '',
      phone: lesson.client.phone ?? '',
      phone_2: lesson.client.phone_2 ?? '',
    })
  }
}

function open(lesson: Partial<Lesson>) {
  setFrom(lesson)
  visible.value = true
  formRef.value?.clearValidate()
}

let clientSearchSeq = 0
async function searchClients(query: string) {
  if (!query) return
  const seq = ++clientSearchSeq
  loadingClients.value = true
  try {
    const result = await getClients({ query, limit: 25 })
    if (seq === clientSearchSeq) clientOptions.value = result.clients
  } finally {
    if (seq === clientSearchSeq) loadingClients.value = false
  }
}

function onClientChange(value: number | string | null) {
  if (typeof value === 'number') {
    const c = clientOptions.value.find((x) => x.id === value)
    if (c) {
      Object.assign(form.client, {
        name: c.name,
        email: c.email ?? '',
        phone: c.phone ?? '',
        phone_2: c.phone_2 ?? '',
      })
      if (!form.name) form.name = c.name
    }
  } else if (typeof value === 'string') {
    Object.assign(form.client, { name: value, email: '', phone: '', phone_2: '' })
    if (!form.name) form.name = value
  }
}

// the price follows the duration and number of persons for lessons that are being created
watch(
  () => [form.startTime, form.endTime, form.persons_count, visible.value] as const,
  () => {
    if (!visible.value || !isNew.value || form.is_time_off) return
    const hours = instant(form.endTime).diff(instant(form.startTime), 'minute') / 60
    if (hours > 0) form.price = durationToPrice(hours, form.persons_count)
  },
)

function buildPayload(): LessonPayload {
  const payload: LessonPayload = {
    from: toBackendDateTime(instant(form.startTime)),
    to: toBackendDateTime(instant(form.endTime)),
    type: form.type,
    price: form.is_time_off ? 0 : form.price,
    note: form.note || null,
    persons_count: form.persons_count,
    instructor_id: form.instructor_id as number,
    is_time_off: form.is_time_off,
  }
  if (form.name) payload.name = form.name
  // the create endpoint doesn't take an empty note; on update null clears it
  if (isNew.value && !form.note) delete payload.note
  if (needsClient.value) {
    payload.client =
      typeof form.clientKey === 'number'
        ? { id: form.clientKey }
        : {
            name: form.client.name,
            ...(form.client.email ? { email: form.client.email } : {}),
            ...(form.client.phone ? { phone: form.client.phone } : {}),
            ...(form.client.phone_2 ? { phone_2: form.client.phone_2 } : {}),
          }
  }
  return payload
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || saving.value) return
  saving.value = true
  try {
    const payload = buildPayload()
    if (isNew.value) {
      await createLesson(payload)
      ElMessage.success(t('messages.successCreate'))
    } else {
      await updateLesson(form.id, payload)
      ElMessage.success(t('messages.successUpdate'))
    }
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

async function remove() {
  await deleteLesson(form.id)
  ElMessage.success(t('messages.successDelete'))
  visible.value = false
  emit('deleted', form.id)
}

function pay() {
  visible.value = false
  emit('pay', { id: form.id } as Lesson)
}

defineExpose({ open })
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="isNew ? t('lessons.newTitle') : t('lessons.title')"
    direction="rtl"
    size="min(460px, 100vw)"
    append-to-body
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="isPaid && !isNew">
      <el-form-item :label="t('lessons.timeOff')">
        <el-switch v-model="form.is_time_off" />
        <span v-if="form.is_time_off" class="ml-3 text-xs text-gray-500">{{ t('lessons.timeOffHint') }}</span>
      </el-form-item>

      <el-form-item :label="t('lessons.instructor')" prop="instructor_id">
        <el-select v-model="form.instructor_id" class="w-full" filterable>
          <el-option v-for="i in instructors.all" :key="i.id" :label="i.name" :value="i.id" />
        </el-select>
      </el-form-item>

      <div class="grid grid-cols-2 gap-3">
        <el-form-item :label="t('lessons.startTime')">
          <el-select v-model="form.startTime" class="w-full">
            <el-option v-for="o in startOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('lessons.endTime')" prop="endTime">
          <el-select v-model="form.endTime" class="w-full">
            <el-option v-for="o in endOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item :label="t('lessons.type')">
        <el-radio-group v-model="form.type">
          <el-radio-button value="ski">{{ t('lessons.ski') }}</el-radio-button>
          <el-radio-button value="snb">{{ t('lessons.snb') }}</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="!form.is_time_off">
        <div class="grid grid-cols-2 gap-3">
          <el-form-item :label="t('lessons.persons')">
            <el-select v-model="form.persons_count" class="w-full">
              <el-option v-for="n in 4" :key="n" :label="String(n)" :value="n" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('lessons.price')">
            <el-input-number v-model="form.price" :min="0" :precision="2" class="w-full" controls-position="right" />
          </el-form-item>
        </div>

        <el-form-item :label="t('lessons.name')">
          <el-input v-model="form.name" clearable />
        </el-form-item>

        <template v-if="isNew || form.wasTimeOff">
          <el-form-item :label="t('lessons.client')" prop="clientKey">
            <el-select
              v-model="form.clientKey"
              class="w-full"
              filterable
              remote
              allow-create
              default-first-option
              clearable
              :remote-method="searchClients"
              :loading="loadingClients"
              :placeholder="t('lessons.searchClient')"
              @change="onClientChange"
            >
              <el-option v-for="c in clientOptions" :key="c.id" :value="c.id" :label="c.name">
                <span>{{ c.name }}</span>
                <span v-if="c.phone" class="float-right text-xs text-gray-400">{{ c.phone }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <template v-if="showClientFields">
            <el-form-item prop="client.email">
              <el-input v-model="form.client.email" :placeholder="t('lessons.email')" :disabled="!!existingClient" clearable />
            </el-form-item>
            <el-form-item>
              <el-input v-model="form.client.phone" :placeholder="t('lessons.phone')" :disabled="!!existingClient" clearable />
            </el-form-item>
            <el-form-item>
              <el-input v-model="form.client.phone_2" :placeholder="t('lessons.phone2')" :disabled="!!existingClient" clearable />
            </el-form-item>
          </template>
        </template>
        <el-form-item v-else :label="t('lessons.client')">
          <el-input :model-value="form.client.name" disabled />
        </el-form-item>
      </template>

      <el-form-item :label="t('lessons.note')">
        <el-input v-model="form.note" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex flex-col gap-2">
        <el-button v-if="!isNew && !isPaid && !form.is_time_off" type="success" class="!ml-0 w-full" @click="pay">
          {{ t('lessons.pay') }}
        </el-button>
        <div class="flex gap-2">
          <el-popconfirm
            v-if="!isNew"
            :title="t('lessons.areYouSure')"
            :confirm-button-text="t('confirm')"
            :cancel-button-text="t('cancel')"
            @confirm="remove"
          >
            <template #reference>
              <el-button type="danger" :disabled="isPaid">{{ t('delete') }}</el-button>
            </template>
          </el-popconfirm>
          <el-button class="flex-1" @click="visible = false">{{ t('cancel') }}</el-button>
          <el-button class="flex-1" type="primary" :loading="saving" :disabled="isPaid && !isNew" @click="save">
            {{ saving ? t('saving') : t('save') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>
