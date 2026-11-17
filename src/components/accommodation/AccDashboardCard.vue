<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAccStats } from '@/api/accommodation/calendar'
import { euro } from './geometry'
import { useAccommodationAuthStore } from '@/stores/accommodationAuth'
import type { AccStats } from '@/types/accommodation'

const { t } = useI18n()
const auth = useAccommodationAuthStore()
const stats = ref<AccStats | null>(null)

onMounted(async () => {
  if (!auth.isLoggedIn) return
  try {
    stats.value = await getAccStats()
  } catch {
    /* the card simply stays empty */
  }
})
const hm = (s: string) => s.slice(11, 16)
</script>

<template>
  <el-card class="mb-4" shadow="never" data-test="acc-card">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="font-medium">{{ t('acc.dash.title') }}</span>
        <router-link :to="auth.isLoggedIn ? { name: 'accommodation-calendar' } : { name: 'accommodation-login' }" class="text-sm text-blue-500">
          {{ auth.isLoggedIn ? t('acc.calendar') : t('acc.dash.loginHint') }} →
        </router-link>
      </div>
    </template>
    <div v-if="stats" class="grid gap-4 md:grid-cols-4">
      <div>
        <div class="text-xs text-gray-500">{{ t('acc.dash.occupancy') }}</div>
        <div class="text-2xl font-semibold">{{ stats.occupancy_percent }} %</div>
      </div>
      <div>
        <div class="text-xs text-gray-500">{{ t('acc.dash.pending') }}</div>
        <router-link :to="{ name: 'accommodation-bookings' }" class="text-2xl font-semibold" :class="stats.pending_count ? 'text-amber-600' : ''">{{ stats.pending_count }}</router-link>
      </div>
      <div>
        <div class="text-xs text-gray-500">{{ t('acc.dash.arrivals') }}</div>
        <div v-if="!stats.arrivals_today.length" class="text-sm text-gray-400">{{ t('acc.dash.none') }}</div>
        <div v-for="a in stats.arrivals_today" :key="a.id" class="text-sm">{{ hm(a.time) }} · {{ a.guest }} · {{ a.unit }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-500">{{ t('acc.dash.departures') }}</div>
        <div v-if="!stats.departures_today.length" class="text-sm text-gray-400">{{ t('acc.dash.none') }}</div>
        <div v-for="a in stats.departures_today" :key="a.id" class="text-sm">{{ hm(a.time) }} · {{ a.guest }} · {{ a.unit }}</div>
      </div>
    </div>
    <div v-if="stats && stats.unpaid_balance > 0" class="mt-2 text-sm text-gray-500">{{ t('acc.dash.unpaid') }}: {{ euro(stats.unpaid_balance) }}</div>
  </el-card>
</template>
