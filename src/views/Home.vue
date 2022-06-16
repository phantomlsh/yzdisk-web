<script setup>
import moment from 'moment'
import request from '../utils/request.js'
import icon from '../utils/icon.js'
import { UploadIcon, FolderAddIcon } from '@heroicons/vue/outline'
import { useRouter, useRoute } from 'vue-router'
const router = useRouter(), route = useRoute()
const SS = window.sessionStorage
const opt = () => ({ headers: { token: SS.token } })

let nodes = $ref([]), dir = route.params.nid
let breadcrumb = $ref([])

async function getDir () {
  const res = await request.get('/yzdisk/dir/' + (dir || ''), opt())
  if (!res) return false
  return nodes = res
}

async function newDir () {
  const res = await request.post('/yzdisk/dir', { name: '新建文件夹', dir }, opt())
  if (!res) return
  nodes.push({ _id: res, type: '.', name: '新建文件夹', time: Date.now(), private: false })
}

if (SS.token) getDir()
else router.push('/login')

function time2Str (t) {
  return moment(t).format('YYYY-MM-DD HH:mm:ss')
}

// navigation functions

async function goto (n) {
  if (n.type === '.') {
    router.push('/' + n._id)
    dir = n._id
    await getDir()
    breadcrumb.push(n)
    console.log(breadcrumb)
  }
}

async function back () {
  const d = breadcrumb[breadcrumb.length - 2]
  router.push('/' + (d?._id || ''))
  dir = d?._id || ''
  await getDir()
  breadcrumb.pop()
}

async function gobreadcrumb (i) {
  const d = breadcrumb[i]
  router.push('/' + (d?._id || ''))
  dir = d?._id || ''
  await getDir()
  breadcrumb.splice(i + 1)
}
</script>

<template>
  <div class="p-4">
    <div class="flex items-center my-3">
      <button @click="newDir" class="all-transition mr-4 shadow bg-blue-500 text-white font-bold rounded flex items-center py-2 px-4 hover:shadow-lg">
        <upload-icon class="w-5 mr-1" />
        上传文件
      </button>
      <button @click="newDir" class="all-transition m-1 border border-gray-300 rounded-full p-2 hover:bg-gray-100 text-sm"><folder-add-icon class="w-5" /></button>
    </div>
    <div class="flex items-center my-2 text-gray-500"><!-- breadcrumb -->
      <div class="cursor-pointer hover:underline" :class="!breadcrumb.length && 'text-black font-bold'" @click="gobreadcrumb(-1)">所有文件</div>
      <div v-for="(b, i) in breadcrumb" @click="gobreadcrumb(i)">
        <span class="mx-1">/</span>
        <span class="cursor-pointer hover:underline" :class="breadcrumb.length === i + 1 && 'text-black font-bold'">{{ b.name }}</span>
      </div>
    </div>
    <div><!-- directory -->
      <table class="table w-full">
        <tr v-if="breadcrumb.length" class="all-transition border border-x-0 cursor-pointer hover:bg-gray-100" @dblclick="back">
          <td class="h-10">
            <div class="px-2 flex items-center">
              <img src="icon/return.png" class="w-6">
              <div class="mx-2 hover:underline text-sm select-none">返回上级目录</div>
            </div>
          </td>
          <td class="w-48"></td>
        </tr>
        <tr v-for="n in nodes" class="all-transition border border-x-0 cursor-pointer hover:bg-gray-100 select-none" @dblclick="goto(n)">
          <td class="h-12 flex items-center justify-between">
            <div class="px-2 flex items-center">
              <img :src="icon[n.type] || 'icon/file.svg'" class="w-6">
              <div class="mx-2 hover:underline text-sm">{{ n.name }}</div>
            </div>
            <div>
            </div>
          </td>
          <td class="text-center text-gray-500 text-sm w-48">{{ time2Str(n.time) }}</td>
        </tr>
      </table>
      <div v-if="!nodes.length" class="mt-20 w-full flex flex-col items-center justify-center">
        <img src="icon/cloud.svg" >
        <p class="text-gray-500">这里还是空空的</p>
      </div>
    </div>
  </div>
</template>
