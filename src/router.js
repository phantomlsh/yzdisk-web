import { createRouter, createWebHashHistory } from 'vue-router'

const index = {
  '/preview/:nid/:token': () => import('./views/Preview.vue'),
  '/': () => import('./views/Home.vue'),
}

const routes = []
for (const r in index) routes.push({ path: r, component: index[r] })
const router = createRouter({ history: createWebHashHistory(), routes }) 

router.afterEach(() => {
  Swal.close()
})

export default router