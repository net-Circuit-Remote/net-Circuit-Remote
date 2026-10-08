import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { configureApiClient } from './services/api/client'
import './style.css'

configureApiClient({ baseUrl: import.meta.env.VITE_API_BASE_URL || '/api' })
createApp(App).use(createPinia()).use(router).mount('#app')
