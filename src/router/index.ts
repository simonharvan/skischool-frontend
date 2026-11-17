import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccommodationAuthStore } from '@/stores/accommodationAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/login/LoginView.vue'), meta: { public: true } },
    {
      path: '/accommodation/login',
      name: 'accommodation-login',
      component: () => import('@/views/accommodation/AccLoginView.vue'),
      meta: { public: true, realm: 'accommodation' },
    },
    {
      path: '/payouts/print/:instructorId',
      name: 'payout-print',
      component: () => import('@/views/payouts/PayoutPrintView.vue'),
    },
    {
      path: '/',
      component: () => import('@/layout/AppLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue'), meta: { title: 'route.dashboard' } },
        { path: 'lessons', name: 'lessons', component: () => import('@/views/lessons/LessonsView.vue'), meta: { title: 'route.lessons' } },
        { path: 'attendance', name: 'attendance', component: () => import('@/views/attendance/AttendanceView.vue'), meta: { title: 'route.attendance' } },
        { path: 'instructors', name: 'instructors', component: () => import('@/views/instructors/InstructorsView.vue'), meta: { title: 'route.instructors' } },
        { path: 'payouts', name: 'payouts', component: () => import('@/views/payouts/PayoutsView.vue'), meta: { title: 'route.payouts' } },
        { path: 'clients', name: 'clients', component: () => import('@/views/clients/ClientsView.vue'), meta: { title: 'route.clients' } },
      ],
    },
    {
      path: '/accommodation',
      component: () => import('@/layout/AppLayout.vue'),
      meta: { realm: 'accommodation' },
      children: [
        { path: '', redirect: { name: 'accommodation-calendar' } },
        { path: 'calendar', name: 'accommodation-calendar', component: () => import('@/views/accommodation/AccCalendarView.vue'), meta: { title: 'acc.calendar', realm: 'accommodation' } },
        { path: 'bookings', name: 'accommodation-bookings', component: () => import('@/views/accommodation/AccBookingsView.vue'), meta: { title: 'acc.bookings', realm: 'accommodation' } },
        { path: 'guests', name: 'accommodation-guests', component: () => import('@/views/accommodation/AccGuestsView.vue'), meta: { title: 'acc.guests', realm: 'accommodation' } },
        { path: 'settings', name: 'accommodation-settings', component: () => import('@/views/accommodation/AccSettingsView.vue'), meta: { title: 'acc.settings', realm: 'accommodation' } },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { public: true } },
  ],
})

router.beforeEach((to) => {
  if (to.matched.some((r) => r.meta.realm === 'accommodation')) {
    const acc = useAccommodationAuthStore()
    if (to.name === 'accommodation-login') {
      return acc.isLoggedIn ? { path: (to.query.redirect as string) || '/accommodation' } : true
    }
    if (!acc.isLoggedIn) return { name: 'accommodation-login', query: { redirect: to.fullPath } }
    return true
  }
  const auth = useAuthStore()
  if (to.meta.public) {
    if (to.name === 'login' && auth.isLoggedIn) return { path: (to.query.redirect as string) || '/' }
    return true
  }
  if (!auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
  return true
})

export default router
