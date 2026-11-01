<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { type FormInstance, type FormRules } from 'element-plus'
import { updateClient } from '@/api/clients'
import type { Client } from '@/types'

const emit = defineEmits<{ saved: [] }>()
const { t } = useI18n()

const visible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ id: 0, name: '', email: '', phone: '', phone_2: '' })

const rules: FormRules = {
  name: [{ required: true, message: () => t('client.nameRequired'), trigger: 'blur' }],
  email: [
    {
      validator: (_r, v: string, cb) =>
        !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? cb() : cb(new Error(t('client.emailInvalid'))),
      trigger: 'blur',
    },
  ],
}

function open(client: Client) {
  Object.assign(form, {
    id: client.id,
    name: client.name,
    email: client.email ?? '',
    phone: client.phone ?? '',
    phone_2: client.phone_2 ?? '',
  })
  visible.value = true
  formRef.value?.clearValidate()
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await updateClient(form.id, {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      phone_2: form.phone_2 || null,
    })
    ElMessage.success(t('messages.successUpdate'))
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-drawer v-model="visible" :title="t('client.edit')" size="min(420px, 100vw)" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item :label="t('name')" prop="name"><el-input v-model="form.name" /></el-form-item>
      <el-form-item :label="t('email')" prop="email"><el-input v-model="form.email" /></el-form-item>
      <el-form-item :label="t('phone')"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item :label="t('phone2')"><el-input v-model="form.phone_2" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ t('save') }}</el-button>
    </template>
  </el-drawer>
</template>
