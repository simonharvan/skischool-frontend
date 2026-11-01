<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { type FormInstance, type FormRules } from 'element-plus'
import { createInstructor, updateInstructor } from '@/api/instructors'
import type { Gender, Instructor, Teaching } from '@/types'
import { randomPassword } from '@/utils/format'

const emit = defineEmits<{ saved: [] }>()
const { t } = useI18n()

const visible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  id: -1,
  name: '',
  email: '',
  phone: '',
  gender: 'male' as Gender,
  teaching: 'both' as Teaching,
  password: '',
})

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? '')
const rules: FormRules = {
  name: [{ required: true, message: () => t('instructor.nameRequired'), trigger: 'blur' }],
  email: [
    {
      validator: (_r, v: string, cb) => (emailOk(v) ? cb() : cb(new Error(t('instructor.emailInvalid')))),
      trigger: 'blur',
    },
  ],
  phone: [{ required: true, message: () => t('instructor.phoneRequired'), trigger: 'blur' }],
  password: [
    {
      validator: (_r, v: string, cb) => {
        if (form.id < 0 && !v) return cb(new Error(t('instructor.passwordRequired')))
        if (v && v.length < 6) return cb(new Error(t('instructor.passwordShort')))
        cb()
      },
      trigger: 'blur',
    },
  ],
}

function open(instructor?: Instructor) {
  Object.assign(form, {
    id: instructor?.id ?? -1,
    name: instructor?.name ?? '',
    email: instructor?.email ?? '',
    phone: instructor?.phone ?? '',
    gender: instructor?.gender ?? 'male',
    teaching: instructor?.teaching ?? 'both',
    password: '',
  })
  visible.value = true
  formRef.value?.clearValidate()
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  const payload = {
    name: form.name,
    email: form.email,
    phone: form.phone,
    gender: form.gender,
    teaching: form.teaching,
    // only sent when filled in – an empty one would reset the login of the instructor app
    ...(form.password ? { password: form.password } : {}),
  }
  try {
    if (form.id < 0) {
      await createInstructor(payload)
      ElMessage.success(t('messages.successCreate'))
    } else {
      await updateInstructor(form.id, payload)
      ElMessage.success(t('messages.successUpdate'))
    }
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-drawer v-model="visible" :title="t('instructor.title')" size="min(420px, 100vw)" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item :label="t('instructor.name')" prop="name"><el-input v-model="form.name" /></el-form-item>
      <el-form-item :label="t('instructor.gender')">
        <el-radio-group v-model="form.gender">
          <el-radio-button value="male">{{ t('instructor.male') }}</el-radio-button>
          <el-radio-button value="female">{{ t('instructor.female') }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="t('instructor.teaching')">
        <el-radio-group v-model="form.teaching">
          <el-radio-button value="ski">{{ t('instructor.ski') }}</el-radio-button>
          <el-radio-button value="snb">{{ t('instructor.snb') }}</el-radio-button>
          <el-radio-button value="both">{{ t('instructor.both') }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="t('instructor.email')" prop="email"><el-input v-model="form.email" /></el-form-item>
      <el-form-item :label="t('instructor.phone')" prop="phone"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item :label="t('instructor.password')" prop="password">
        <el-input v-model="form.password" autocomplete="new-password">
          <template #append>
            <el-button @click="form.password = randomPassword()">{{ t('generate') }}</el-button>
          </template>
        </el-input>
        <div class="mt-1 text-xs text-gray-500">{{ t('instructor.passwordHint') }}</div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ t('save') }}</el-button>
    </template>
  </el-drawer>
</template>
