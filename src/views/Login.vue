<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter(), route = useRoute()

const SS = window.sessionStorage
const token = route.query.token, c = route.query.c

const login = () => window.open('https://cn.aauth.link/#/launch/yzdisk', 'aauth', 'width=400,height=800,top=50,left=50')
window.onmessage = e => {
  if (e.origin !== 'https://cn.aauth.link') return
  SS.token = e.data.token
  router.push('/')
}

if (route.query.dir) yzdisk.dir = route.query.dir

if (token) {
  SS.token = token
  router.push('/')
} else if (SS.token) {
  router.push('/')
} else {
  login()
}
</script>

<template>
  <div class="w-screen h-screen flex flex-col items-center justify-center" v-if="!SS.token">
    <h1 class="font-bold text-2xl">请在弹出页面登录</h1>
    <p class="text-gray-500 my-3">请勿关闭本页面</p>
  </div>
</template>