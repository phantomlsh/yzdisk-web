<script setup>
import { useRoute } from 'vue-router'
import { CloudArrowDownIcon } from '@heroicons/vue/24/outline'
import request from '../utils/request.js'
import icon from '../utils/icon.js'

let data = $ref({}), str = $ref(''), mode = $ref('')
let blob = null
const route = useRoute()
if (route.query.token) window.sessionStorage.token = route.query.token
const nid = route.params.nid, token = window.sessionStorage.token
const src = 'https://s.yzzx.org/yzdisk/file/' + nid + '?token=' + token

const T = {
  code: ['html', 'htm', 'c', 'cpp', 'h', 'css', 'js', 'py'],
  image: ['jpeg', 'jpg', 'png', 'gif', 'tif', 'tiff', 'svg'],
  video: ['mp4', 'mov', 'avi', 'flv', 'webm', 'mkv'],
  office: ['ppt', 'pptx', 'xls', 'xlsx', 'csv', 'doc', 'docx']
}

init()
async function init () {
  const res = await request.get('/yzdisk/query/' + nid, { headers: { token }})
  if (!res || !res[nid]) {
    await Swal.fire('文件不存在', '', 'error')
    window.close()
    return
  }
  data = res[nid]
  console.log(data)
  data.type = data.type.toLowerCase()
  if (data.type === 'txt') mode = 'txt'
  if (data.type === '.') mode = '.'
  if (data.type === 'pdf') mode = 'pdf'
  for (const t in T) {
    if (T[t].includes(data.type)) mode = t
  }
  if (['txt', 'code'].includes(mode)) {
    blob = await getBlob()
    str = await blob.text()
  }
  if (mode === 'pdf') {
    blob = await getBlob()
    str = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
  }
}

const getBlob = () => request.get('/yzdisk/file/' + nid, { headers: { token }, responseType: 'blob' })

async function download () {
  if (data.type === '.') {
    window.location.href = '/#/?dir=' + nid + '&token=' + token
    return
  }
  const res = blob || await getBlob()
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
  <div class="flex flex-col w-full h-screen" v-if="data.type">
    <div class="flex justify-between items-center shadow relative z-10">
      <div class="flex items-center">
        <img :src="icon[data.type] || 'icon/file.svg'" class="w-8 mx-1">
        <p>{{ data.name }}</p>
      </div>
      <button v-if="data.type !== '.'" @click="download" class="text-blue-500 font-bold flex items-center py-2 px-4">
        <CloudArrowDownIcon class="w-5 mr-1" />
        下载
      </button>
    </div>
    <div class="grow w-full overflow-auto">
      <pre v-if="mode === 'txt' || mode === 'code'" class="p-4">{{ str }}</pre>
      <div v-if="mode === 'image' || mode === 'video'" class="w-full h-full flex items-center justify-center bg-gray-200">
        <img v-if="mode === 'image'" :src="src" class="max-w-full max-h-full">
        <video class="max-w-full max-h-full" controls>
          <source :src="src">
        </video>
      </div>
      <iframe v-if="mode === 'office'" class="w-full h-full" :src="'https://view.officeapps.live.com/op/embed.aspx?src=' + src"></iframe>
      <iframe v-if="mode === 'pdf'" class="w-full h-full" :src="str"></iframe>
      <div v-if="mode === '' || mode === '.'" class="w-full h-full flex flex-col items-center justify-center bg-gray-50">
        <img :src="icon[data.type] || 'icon/file.svg'" class="w-36 mx-1">
        <h3 class="text-xl font-bold">{{ data.name }}</h3>
        <button @click="download" class="bg-blue-500 text-white rounded shadow all-transition hover:shadow-md font-bold flex items-center py-2 px-4 my-4">
          <CloudArrowDownIcon class="w-5 mr-1" />
          {{ mode === '.' ? '打开文件夹' : '下载文件' }}
        </button>
      </div>
    </div>
  </div>
</template>
