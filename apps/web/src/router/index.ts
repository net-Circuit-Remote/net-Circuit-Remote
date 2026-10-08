import { createRouter, createWebHistory } from 'vue-router'

export const navigation = [
  { path: '/', label: 'Dashboard' },
  { path: '/laboratory', label: 'Laboratory' },
  { path: '/circuits', label: 'Circuits' },
  { path: '/stations', label: 'Stations' },
  { path: '/experiments', label: 'Experiments' },
  { path: '/settings', label: 'Settings' },
]
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('../pages/DashboardPage.vue') },
    { path: '/dashboard', redirect: '/' },
    { path: '/laboratory', name: 'laboratory', component: () => import('../pages/LaboratoryPage.vue') },
    { path: '/circuits', name: 'circuits', component: () => import('../pages/CircuitsPage.vue') },
    { path: '/stations', name: 'stations', component: () => import('../pages/StationsPage.vue') },
    { path: '/experiments', name: 'experiments', component: () => import('../pages/ExperimentsPage.vue') },
    { path: '/settings', name: 'settings', component: () => import('../pages/SettingsPage.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../pages/NotFoundPage.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
router.afterEach((route) => {
  const label = navigation.find((item) => item.path === route.path)?.label ?? 'Page not found'
  document.title = `${label} · net*CIRCUIT Remote`
})
