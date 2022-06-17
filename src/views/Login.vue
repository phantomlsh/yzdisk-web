<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter(), route = useRoute()

const SS = window.sessionStorage

const login = () => window.open('https://cn.aauth.link/#/launch/yzdisk', 'aauth', 'width=400,height=800,top=50,left=50')
window.onmessage = e => {
  if (e.origin !== 'https://cn.aauth.link') return
  SS.token = e.data.token
  router.push('/')
}

window.yzdisk = {
  dir: route.query.dir || '',
}

if (route.query.select && (window.opener || window.parent)) window.yzdisk.select = route.query.select
if (route.query.token) SS.token = req.query.token

if (SS.token) router.push('/')
else login()
</script>

<template>
  <div class="w-screen h-screen flex flex-col items-center justify-center" v-if="!SS.token">
    <h1 class="font-bold text-2xl text-center">请在弹出页面登录<br>请勿关闭本页</h1>
    <p class="text-gray-500 my-1">没有弹出页面？<span class="underline text-blue-500 cursor-pointer" @click="login">点击这里</span></p>
  </div>
</template>