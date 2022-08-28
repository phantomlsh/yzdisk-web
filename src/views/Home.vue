<script setup>
import request from '../utils/request.js'
import ItemRow from '../components/ItemRow.vue'
import { UploadIcon, FolderAddIcon, CheckIcon, XIcon, LoginIcon } from '@heroicons/vue/outline'
import { useRouter } from 'vue-router'
const router = useRouter()
const SS = window.sessionStorage
const opt = () => ({ headers: { token: SS.token } })

let nodes = $ref([]), dir = $ref('')
let breadcrumb = $ref([]), uploading = $ref('')
if (SS.dir) {
  dir = SS.dir
  SS.dir = ''
  breadcrumb.push({ _id: dir, name: '链接目录', external: true })
}

async function getDir () {
  const res = await request.get('/yzdisk/dir/' + (dir || ''), opt())
  if (!res) return false
  return nodes = res
}

if (SS.token) getDir()
else router.push('/@')

// display

const getType = name => {
  const ns = name.split('.')
  ns.shift()
  return ns.pop() || ''
}
const short = (x, l = 8) => {
  const type = getType(x)
  if (x.length - type.length < l) return x
  return x.substring(0, l) + '...' + type
}

let displayNodes = $computed(() => nodes.sort((x, y) => {
  if (x.type === '.' && y.type !== '.') return -1
  if (y.type === '.' && x.type !== '.') return 1
  return x.name.toLowerCase() < y.name.toLowerCase() ? -1 : 1
}))

let isExternal = $computed(() => {
  for (const b of breadcrumb) {
    if (b.external) return true
  }
  return false
})

// file operations

let fileInput = $ref()

async function upload (f) {
  if (!f) return
  uploading = f.name
  const formData = new FormData()
  formData.append('file', f)
  if (dir) formData.append('dir', dir)
  const _dir = dir
  const res = await request.post('/yzdisk/file', formData, { headers: { 'Content-Type': 'multipart/form-data', token: SS.token } })
  uploading = ''
  if (!res || _dir !== dir) return
  nodes.push({ _id: res, name: f.name, private: false, time: Date.now(), type: getType(f.name) })
}

function dropFile (e) {
  upload(e.dataTransfer.files[0])
}

// other operations

async function goto (nid) {
  dir = nid || ''
  await getDir()
}

async function newDir () {
  const res = await request.post('/yzdisk/dir', { name: '新建文件夹', dir: dir || '' }, opt())
  if (!res) return
  nodes.push({ _id: res, type: '.', name: '新建文件夹', time: Date.now(), private: false })
  // todo edit[res] = true
}

async function open (n) {
  if (n.type === '.') { // goto dir
    if (n._id === moving?._id) return
    await goto(n._id)
    breadcrumb.push(n)
  } else { // download file
    const res = await request.get('/yzdisk/file/' + n._id, { headers: { token: SS.token }, responseType: 'blob' })
    if (!res) return
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', n.name)
    document.body.appendChild(link)
    link.click()
    setTimeout(() => { link.remove() }, 3e3)
  }
}

async function back () {
  const d = breadcrumb[breadcrumb.length - 2]
  await goto(d?._id)
  breadcrumb.pop()
}

async function gotoBreadcrumb (i) {
  const d = breadcrumb[i]
  await goto(d?._id)
  breadcrumb.splice(i + 1)
}

async function rename (n, name) {
  const res = await request.put(`/yzdisk/${n.type === '.' ? 'dir' : 'file'}/${n._id}`, { name }, opt())
  if (!res) return
  n.name = name
  if (n.type !== '.') n.type = getType(n.name)
}

async function remove (n) {
  const isFile = (n.type !== '.')
  const { isConfirmed } = await Swal.fire({
    title: '确认删除' + (isFile ? '文件' : '目录'),
    html: isFile ? `即将删除文件<code>${short(n.name, 16)}</code>` : `即将删除目录<code>${short(n.name, 16)}</code>的全部内容`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '确认删除',
    confirmButtonColor: '#D22B2B',
    cancelButtonText: '取消'
  })
  if (!isConfirmed) return
  const res = await request.put(`/yzdisk/${n.type === '.' ? 'dir' : 'file'}/${n._id}`, { dir: '' }, opt())
  if (!res) return
  nodes = nodes.filter(x => x._id !== n._id)
}

// move
let moving = $ref(null)
async function move () {
  if (!moving) return
  const res = await request.put(`/yzdisk/${moving.type === '.' ? 'dir' : 'file'}/${moving._id}`, { dir: dir || SS.id }, opt())
  if (!res) return
  nodes = nodes.filter(x => x._id !== moving._id)
  nodes.push(moving)
  moving = null
}

// select

let selected = $ref({})
let selectOK = $computed(() => {
  if (!yzdisk.select) return false
  if (yzdisk.select == 1) return Object.keys(selected).length === 1
  return Object.keys(selected).length
})

function select (n) {
  if (selected[n._id]) {
    delete selected[n._id]
    return
  }
  if (!SS.select) return
  if (n.type === '.') return
  if (SS.select == 1) return selected = { [n._id]: n }
  selected[n._id] = n
}

function submitSelect () {
  const payload = []
  for (const id in selected) payload.push(selected[id])
  if (!window.opener && !window.parent) return
  (window.opener || window.parent).postMessage(JSON.parse(JSON.stringify(payload)), '*')
  window.close()
}
</script>

<template>
  <input type="file" class="hidden" ref="fileInput" @change="upload(fileInput.files[0])">
  <button v-if="moving" class="all-transition rounded-full fixed top-2 right-2 bg-white sm:top-5 sm:right-5 shadow-md hover:shadow-lg text-sm text-blue-500 bg-gray-100 font-bold rounded flex items-center py-2 px-4" @click="move"><LoginIcon class="w-5 mr-1" />粘贴{{ moving.type === '.' ? '目录' : '文件' }}</button>
  <div class="rounded-md overflow-hidden fixed bottom-2 right-2 w-60 bg-white sm:bottom-5 sm:right-5 shadow-md bg-gray-50" v-if="SS.select"><!-- select -->
    <div class="text-sm text-white font-bold bg-gray-800 p-2">请选择文件</div>
    <div v-for="(n, _id) in selected" class="border border-x-0 flex items-center justify-between p-2">
      <span>{{ short(n.name, 9) }}</span>
      <XIcon class="w-5 text-red-500 cursor-pointer" @click="delete selected[n._id]" />
    </div>
    <div v-if="selectOK" class="flex items-center justify-end p-1">
      <button class="all-transition text-sm text-blue-500 font-bold rounded flex items-center py-1 px-2" @click="submitSelect"><CheckIcon class="w-5 mr-1" />确认</button>
    </div>
  </div>
  <div class="p-4 min-h-screen w-screen select-none" @drop.prevent="dropFile" @dragenter.prevent @dragover.prevent>
    <div class="flex items-center mt-3 mb-1">
      <button @click="fileInput.click" class="all-transition mr-4 shadow bg-blue-500 text-white font-bold rounded flex items-center py-2 px-4 hover:shadow-lg">
        <UploadIcon class="w-5 mr-1" />
        上传文件
      </button>
      <button @click="newDir" class="all-transition m-1 border border-gray-300 rounded-full p-2 hover:bg-gray-100 text-sm"><FolderAddIcon class="w-5" /></button>
    </div>
    <p v-if="uploading" class="text-gray-500 text-sm">正在上传 {{ uploading }}</p>
    <div class="my-3 text-gray-500"><!-- breadcrumb -->
      <span class="cursor-pointer hover:underline" :class="!breadcrumb.length && 'text-black font-bold'" @click="gotoBreadcrumb(-1)">
        <img :src="'favicon.ico'" class="w-4 mr-1 inline">我的云盘
      </span>
      <span v-for="(b, i) in breadcrumb" @click="gotoBreadcrumb(i)">
        <span class="mx-1">/</span>
        <span class="cursor-pointer hover:underline" :class="breadcrumb.length === i + 1 && 'text-black font-bold'">{{ short(b.name) }}</span>
      </span>
    </div>
    <div><!-- directory -->
      <table class="table w-full">
        <tr v-if="breadcrumb.length" class="all-transition border border-x-0 cursor-pointer hover:bg-gray-100" @dblclick="back">
          <td class="h-10">
            <div class="px-2 flex items-center">
              <img :src="'icon/return.png'" class="w-6">
              <div class="mx-2 text-sm">返回上级目录</div>
            </div>
          </td>
          <td></td>
        </tr>
        <ItemRow v-for="n in displayNodes"
          :node="n" :selected="selected[n._id]" :moving="moving?._id === n._id" :editable="!isExternal"
          @open="open(n)" @select="select(n)" @rename="rename" @move="moving = n" @remove="remove(n)"
        />
      </table>
      <div v-if="!nodes.length" class="mt-20 w-full flex flex-col items-center justify-center">
        <img :src="'icon/cloud.svg'" >
        <p class="text-gray-500 text-sm">白云一片去悠悠，这里什么也没有</p>
      </div>
    </div>
  </div>
</template>
