import { createRouter, createWebHistory } from 'vue-router'
import { workspaceRoutes } from './routes'
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: workspaceRoutes,
})
router.afterEach(() => { document.title = 'Workbench · net*CIRCUIT Remote' })
