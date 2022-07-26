<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter(), route = useRoute()
const SS = window.sessionStorage

function decode () { // decode JWT
  delete SS.id
  const r = SS.token.split('.')
  let input = r[1]
  if (!input) return {}
  input = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = input.length % 4
  if (pad) input += new Array(5 - pad).join('=')
  const payload = JSON.parse(atob(input))
  SS.id = payload.id
}

function init () {
  const q = route.query
  // dir
  if (q.dir) SS.dir = q.dir
  // select
  if (q.select && (window.opener || window.parent)) SS.select = q.select
  // check login
  if (q.token) SS.token = q.token // query login
  if (!SS.token) { // manual login
    window.opener = null
    window.location.href = 'https://cn.aauth.link/#/launch/yzdisk'
    return
  }
  // after login
  decode()
  router.push('/')
}
init()
</script>

<template>
  <div class="w-screen h-screen flex flex-col items-center justify-center" v-if="!SS.token">
    <h1 class="font-bold text-2xl text-center">正在登录</h1>
  </div>
</template>