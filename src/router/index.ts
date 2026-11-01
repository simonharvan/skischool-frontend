import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/login/LoginView.vue'), meta: { public: true } },
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
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { public: true } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    if (to.name === 'login' && auth.isLoggedIn) return { path: (to.query.redirect as string) || '/' }
    return true
  }
  if (!auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
  return true
})

export default router
