<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowDown,
  Calendar,
  HomeFilled,
  Setting,
  Memo,
  DataBoard,
  Expand,
  Fold,
  Money,
  Tickets,
  User,
  UserFilled,
} from '@element-plus/icons-vue'
import logo from '@/assets/logo.png'
import LangSwitch from '@/components/LangSwitch.vue'
import { useAuthStore } from '@/stores/auth'
import { useAccommodationAuthStore } from '@/stores/accommodationAuth'
import { useInstructorsStore } from '@/stores/instructors'
import { logout as apiLogout, me } from '@/api/auth'
import { logout as accLogout, me as accMe } from '@/api/accommodation/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const instructors = useInstructorsStore()
const accAuth = useAccommodationAuthStore()
/** the accommodation section has its own API and login */
const isAcc = computed(() => route.meta.realm === 'accommodation')
const userLabel = computed(() => {
  const u = isAcc.value ? accAuth.user : auth.user
  return u?.name || u?.email || ''
})

const collapsed = ref(window.innerWidth < 1000)
const menu = [
  { index: '/', label: 'route.dashboard', icon: DataBoard },
  { index: '/lessons', label: 'route.lessons', icon: Calendar },
  { index: '/attendance', label: 'route.attendance', icon: Tickets },
  { index: '/instructors', label: 'route.instructors', icon: UserFilled },
  { index: '/payouts', label: 'route.payouts', icon: Money },
  { index: '/clients', label: 'route.clients', icon: User },
]

const accMenu = [
  { index: '/accommodation/calendar', label: 'acc.calendar', icon: Calendar },
  { index: '/accommodation/bookings', label: 'acc.bookings', icon: Memo },
  { index: '/accommodation/guests', label: 'acc.guests', icon: User },
  { index: '/accommodation/settings', label: 'acc.settings', icon: Setting },
]

const title = computed(() => (route.meta.title ? t(route.meta.title as string) : ''))
const active = computed(() => {
  if (route.path.startsWith('/accommodation')) {
    return accMenu.find((m) => route.path.startsWith(m.index))?.index ?? '/accommodation/calendar'
  }
  const match = menu.filter((m) => m.index !== '/' && route.path.startsWith(m.index))
  return match.length ? match[0].index : '/'
})

onMounted(async () => {
  if (isAcc.value) {
    accMe()
      .then((u) => (accAuth.user = u))
      .catch(() => undefined)
    return
  }
  // lessons, attendance and the lesson form all depend on the instructors
  instructors.load().catch(() => undefined)
  me()
    .then((u) => (auth.user = u))
    .catch(() => undefined)
})

/** one log-out ends both sessions; failed calls still drop the tokens locally */
async function logout() {
  await Promise.allSettled([
    auth.isLoggedIn ? apiLogout() : Promise.resolve(),
    accAuth.isLoggedIn ? accLogout() : Promise.resolve(),
  ])
  auth.clear()
  accAuth.clear()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="flex h-full">
    <aside
      class="sidebar shrink-0 overflow-y-auto transition-all duration-200"
      :style="{ width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)' }"
    >
      <router-link to="/" class="logo">
        <img :src="logo" alt="logo" />
        <span v-if="!collapsed">Ski school</span>
      </router-link>
      <el-menu
        :default-active="active"
        :collapse="collapsed"
        :collapse-transition="false"
        :default-openeds="['/accommodation']"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#1890ff"
        class="side-menu"
      >
        <el-menu-item v-for="m in menu" :key="m.index" :index="m.index">
          <el-icon><component :is="m.icon" /></el-icon>
          <template #title>{{ t(m.label) }}</template>
        </el-menu-item>
        <el-sub-menu index="/accommodation">
          <template #title>
            <el-icon><HomeFilled /></el-icon>
            <span>{{ t('acc.menu') }}</span>
          </template>
          <el-menu-item v-for="m in accMenu" :key="m.index" :index="m.index">
            <template #title>{{ t(m.label) }}</template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="topbar">
        <el-icon class="cursor-pointer text-xl" @click="collapsed = !collapsed">
          <component :is="collapsed ? Expand : Fold" />
        </el-icon>
        <h1 class="m-0 ml-3 text-base font-medium">{{ title }}</h1>
        <div class="flex-1" />
        <LangSwitch />
        <el-dropdown class="ml-4" trigger="click">
          <span class="flex cursor-pointer items-center gap-1 text-sm">
            {{ userLabel }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="logout">{{ t('navbar.logOut') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </header>
      <main class="min-h-0 flex-1 overflow-auto p-4 md:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  background: var(--sidebar-bg);
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  overflow: hidden;
  white-space: nowrap;
}
.logo img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.side-menu {
  border-right: none;
}
.topbar {
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0 16px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}
</style>
