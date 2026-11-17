<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import logo from '@/assets/logo.png'
import LangSwitch from '@/components/LangSwitch.vue'
import { login } from '@/api/accommodation/auth'
import { useAccommodationAuthStore } from '@/stores/accommodationAuth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAccommodationAuthStore()

const loading = ref(false)
const form = reactive({ email: '', password: '' })

async function submit() {
  if (loading.value || !form.email || !form.password) return
  loading.value = true
  try {
    const res = await login(form.email, form.password)
    auth.setToken(res.token)
    auth.user = res.user
    router.replace((route.query.redirect as string) || '/accommodation')
  } catch (e: any) {
    if (e?.response?.status === 422 || e?.response?.status === 401) ElMessage.error(t('login.failed'))
    else ElMessage.error(t('messages.genericError'))
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
        <h2 class="m-0 text-xl font-medium">{{ t('acc.login') }}</h2>
      </div>
      <el-form label-position="top" @submit.prevent="submit">
        <el-form-item :label="t('login.email')">
          <el-input v-model="form.email" type="email" autocomplete="username" @keyup.enter="submit" />
        </el-form-item>
        <el-form-item :label="t('login.password')">
          <el-input v-model="form.password" type="password" show-password autocomplete="current-password" @keyup.enter="submit" />
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
