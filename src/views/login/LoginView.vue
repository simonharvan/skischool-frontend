<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { type FormInstance, type FormRules } from 'element-plus'
import logo from '@/assets/logo.png'
import LangSwitch from '@/components/LangSwitch.vue'
import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ email: '', password: '' })

const rules: FormRules = {
  email: [
    {
      validator: (_r, value: string, cb) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? '') ? cb() : cb(new Error(t('login.emailInvalid'))),
      trigger: 'blur',
    },
  ],
  password: [
    {
      validator: (_r, value: string, cb) =>
        (value ?? '').length >= 6 ? cb() : cb(new Error(t('login.passwordShort'))),
      trigger: 'blur',
    },
  ],
}

async function submit() {
  if (!formRef.value || loading.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const { access_token } = await login(form.email, form.password)
    auth.setToken(access_token)
    router.replace((route.query.redirect as string) || '/')
  } catch (e: any) {
    // 422 is a wrong password – the http client only reports other failures itself
    if (e?.response?.status === 422 || e?.response?.status === 401) {
      ElMessage.error(t('login.failed'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <div class="absolute right-4 top-4"><LangSwitch /></div>
    <el-card class="w-full max-w-sm">
      <div class="mb-6 flex flex-col items-center gap-2">
        <img :src="logo" alt="logo" class="h-16" />
        <h2 class="m-0 text-xl font-medium">{{ t('login.title') }}</h2>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
        <el-form-item :label="t('login.email')" prop="email">
          <el-input v-model="form.email" type="email" autocomplete="username" @keyup.enter="submit" />
        </el-form-item>
        <el-form-item :label="t('login.password')" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            autocomplete="current-password"
            @keyup.enter="submit"
          />
        </el-form-item>
        <el-button type="primary" class="w-full" :loading="loading" native-type="submit" @click="submit">
          {{ t('login.logIn') }}
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 16px;
  background: #2d3a4b;
}
</style>
