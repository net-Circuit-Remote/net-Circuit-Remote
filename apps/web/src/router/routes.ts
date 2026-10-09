import type { RouteRecordRaw } from 'vue-router'

// Address compatibility only: the mounted shell owns every lab workflow.
export const workspaceRoutes: RouteRecordRaw[] = [
  { path: '/', name: 'SingleWorkspace', component: { render: () => null } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
