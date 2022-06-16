import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import './index.css'

window.yzdisk = {}

createApp(App).use(router).mount('#app')
