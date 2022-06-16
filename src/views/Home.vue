<script setup>
import moment from 'moment'
import request from '../utils/request.js'
import icon from '../utils/icon.js'
import { UploadIcon } from '@heroicons/vue/outline'
import { useRouter, useRoute } from 'vue-router'
const router = useRouter(), route = useRoute()
const SS = window.sessionStorage
const opt = () => ({ headers: { token: SS.token } })

let nodes = $ref([]), dir = $ref('')

async function getDir () {
  const res = await request.get('/yzdisk/dir/' + (dir || ''), opt())
  if (!res) return
  nodes = res
  console.log(res)
}

async function newDir () {
  const res = await request.post('/yzdisk/dir', { name: '新建文件夹', dir }, opt())
  if (!res) return
  nodes.push({ _id: res, type: '.', name: '新建文件夹', time: Date.now(), private: false })
}

async function init () {
  getDir()
}

if (SS.token) init()
else router.push('/login')

function time2Str (t) {
  return moment(t).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between my-5"><!-- operations -->
      <div>
        <div class="font-bold">此处显示文件夹面包屑</div>
      </div>
      <div class="flex items-center">
        <button @click="newDir" class="all-transition m-1 border border-gray-300 rounded py-1 px-3 hover:bg-gray-100 text-sm">新建文件夹</button>
        <button @click="newDir" class="all-transition m-1 shadow bg-blue-500 text-white font-bold rounded flex items-center py-1 px-3 hover:shadow-lg">
          <upload-icon class="w-5 mr-1" />
          上传文件
        </button>
      </div>
    </div>
    <div><!-- directory -->
      <table class="table w-full" v-if="nodes?.length">
        <tr class="text-gray-600 h-8 text-sm">
          <th class="text-left">名称</th>
          <th class="w-48">创建时间</th>
        </tr>
        <tr v-for="n in nodes" class="all-transition border border-x-0 cursor-pointer hover:bg-gray-100">
          <td class="h-12 flex items-center justify-between">
            <div class="px-2 flex items-center">
              <img :src="icon[n.type] || 'icon/file.svg'" class="w-6">
              <div class="mx-2 hover:underline text-sm">{{ n.name }}</div>
            </div>
            <div>
              
            </div>
          </td>
          <td class="text-center text-gray-500 text-sm">{{ time2Str(n.time) }}</td>
        </tr>
      </table>
      <div v-else>这里还是空空的</div>
    </div>
  </div>
</template>
