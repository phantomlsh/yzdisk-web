<script setup>
import { useRoute } from 'vue-router'
import { CloudArrowDownIcon } from '@heroicons/vue/24/outline'
import request from '../utils/request.js'
import icon from '../utils/icon.js'

let data = $ref({})
const route = useRoute()
const nid = route.params.nid, token = window.sessionStorage.token
const src = "/yzdisk/file/" + nid + "?token=" + token

init()
async function init() {
  const res = await request.get('/yzdisk/query/' + nid, { headers: { token }})
  console.log(res)
  if (!res || !res[nid]) {
    await Swal.fire('文件不存在', '', 'error')
    window.close()
    return
  }
  data = res[nid]
}
async function download() {
  const res = await request.get('/yzdisk/file/' + nid, { headers: { token }, responseType: 'blob' })
  if (!res) return
  const url = window.URL.createObjectURL(new Blob([res]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', data.name)
  document.body.appendChild(link)
  link.click()
  setTimeout(() => { link.remove() }, 3e3)
}
</script>

<template>
  <img v-if="icon[data.type] === 'icon/image.png'" :src="src">
  <div v-else class="flex justify-between items-center">
    <img :src="icon[data.type] || 'icon/file.svg'" class="w-8 mx-1">
    <p>{{ data.name }}</p>
    <button @click="download" class="all-transition mr-4 shadow bg-blue-500 text-white font-bold rounded flex items-center py-2 px-4 hover:shadow-lg">
      <CloudArrowDownIcon class="w-5 mr-1" />
      下载文件
    </button>
  </div>
</template>
