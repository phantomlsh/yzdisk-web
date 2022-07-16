<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter(), route = useRoute()

const SS = window.sessionStorage
function decode (input) {
  if (!input) return {}
  input = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = input.length % 4
  if (pad) input += new Array(5 - pad).join('=')
  return JSON.parse(atob(input))
}

function success () {
  delete SS.id
  const r = SS.token.split('.')
  const payload = decode(r[1])
  SS.id = payload.id
  router.push('/')
}

const login = () => window.location.href = 'https://cn.aauth.link/#/launch/yzdisk'

if (route.query.dir) SS.dir = route.query.dir

if (route.query.select && (window.opener || window.parent)) SS.select = route.query.select
if (route.query.token) SS.token = route.query.token

if (SS.token) success()
else login()
</script>

<template>
  <div class="w-screen h-screen flex flex-col items-center justify-center" v-if="!SS.token">
    <h1 class="font-bold text-2xl text-center">正在登录</h1>
  </div>
</template>