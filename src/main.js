import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import './index.css'

import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

createApp(App).use(router).use(FloatingVue).mount('#app')
