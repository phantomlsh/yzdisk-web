<script setup>
import moment from 'moment'
import request from '../utils/request.js'
import icon from '../utils/icon.js'
import { UploadIcon, FolderAddIcon, PencilIcon, CheckIcon, TrashIcon, XIcon, LinkIcon, LoginIcon } from '@heroicons/vue/outline'
import { useRouter } from 'vue-router'
const router = useRouter()
const SS = window.sessionStorage
const opt = () => ({ headers: { token: SS.token } })

let yzdisk = window.yzdisk

let nodes = $ref([])
let breadcrumb = $ref([]), edit = $ref({}), uploading = $ref('')
if (yzdisk.dir) breadcrumb.push({ _id: yzdisk.dir, name: '链接目录' })

async function getDir () {
  const res = await request.get('/yzdisk/dir/' + (yzdisk.dir || ''), opt())
  if (!res) return false
  return nodes = res
}

if (SS.token) getDir()
else router.push('/@')

// display

const time2Str = t => moment(t).format('YYYY-MM-DD HH:mm:ss')
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

function rowClass (n) {
  let res = selected[n._id] ? 'bg-blue-100' : 'hover:bg-gray-100'
  if (moving?._id === n._id) res += ' opacity-50'
  return res
}

let displayNodes = $computed(() => nodes.sort((x, y) => {
  if (x.type === '.' && y.type !== '.') return -1
  if (y.type === '.' && x.type !== '.') return 1
  return x.name.toLowerCase() < y.name.toLowerCase() ? -1 : 1
}))

// file operations

let fileInput = $ref(), copyInput = $ref()

async function upload (f) {
  if (!f) return
  uploading = f.name
  const formData = new FormData()
  formData.append('file', f)
  if (yzdisk.dir) formData.append('dir', yzdisk.dir)
  const _dir = yzdisk.dir
  const res = await request.post('/yzdisk/file', formData, { headers: { 'Content-Type': 'multipart/form-data', token: SS.token } })
  uploading = ''
  if (!res || _dir !== yzdisk.dir) return
  nodes.push({ _id: res, name: f.name, private: false, time: Date.now(), type: getType(f.name) })
}

function dropFile (e) {
  upload(e.dataTransfer.files[0])
}

// other operations

async function goto (nid) {
  yzdisk.dir = nid || ''
  await getDir()
}

async function newDir () {
  const res = await request.post('/yzdisk/dir', { name: '新建文件夹', dir: yzdisk.dir || '' }, opt())
  if (!res) return
  nodes.push({ _id: res, type: '.', name: '新建文件夹', time: Date.now(), private: false })
  edit[res] = true
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

async function rename (n) {
  edit[n._id] = false
  const div = document.getElementById('name_' + n._id)
  const name = div.innerHTML
  if (!name.match(/\S/) || name === n.name) return div.innerHTML = n.name
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

function copy (n) {
  copyInput.setAttribute('type', 'text')
  copyInput.value = window.location.origin + `/#/@?${n.type === '.' ? 'dir' : 'file'}=${n._id}`
  copyInput.select()
  document.execCommand('copy')
  copyInput.setAttribute('type', 'hidden')
  window.getSelection().removeAllRanges()
  Swal.fire('链接已复制', '链接具有访问权限，请谨慎使用', 'success')
}

// move
let moving = $ref(null)
async function move () {
  if (!moving) return
  const res = await request.put(`/yzdisk/${moving.type === '.' ? 'dir' : 'file'}/${moving._id}`, { dir: yzdisk.dir || SS.id }, opt())
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
  if (!yzdisk.select) return
  if (n.type === '.') return
  if (yzdisk.select == 1) return selected = { [n._id]: n }
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
  <input type="hidden" ref="copyInput">
  <button v-if="moving" class="all-transition rounded-full fixed top-2 right-2 bg-white sm:top-5 sm:right-5 shadow-md hover:shadow-lg text-sm text-blue-500 bg-gray-100 font-bold rounded flex items-center py-2 px-4" @click="move"><login-icon class="w-5 mr-1" />粘贴{{ moving.type === '.' ? '目录' : '文件' }}</button>
  <div class="rounded-md overflow-hidden fixed bottom-2 right-2 w-60 bg-white sm:bottom-5 sm:right-5 shadow-md bg-gray-50" v-if="yzdisk.select"><!-- select -->
    <div class="text-sm text-white font-bold bg-gray-800 p-2">请选择文件</div>
    <div v-for="(n, _id) in selected" class="border border-x-0 flex items-center justify-between p-2">
      <span>{{ short(n.name, 9) }}</span>
      <x-icon class="w-5 text-red-500 cursor-pointer" @click="delete selected[n._id]" />
    </div>
    <div v-if="selectOK" class="flex items-center justify-end p-1">
      <button class="all-transition text-sm text-blue-500 font-bold rounded flex items-center py-1 px-2" @click="submitSelect"><check-icon class="w-5 mr-1" />确认</button>
    </div>
  </div>
  <div class="p-4 min-h-screen w-screen select-none" @drop.prevent="dropFile" @dragenter.prevent @dragover.prevent>
    <div class="flex items-center mt-3 mb-1">
      <button @click="fileInput.click" class="all-transition mr-4 shadow bg-blue-500 text-white font-bold rounded flex items-center py-2 px-4 hover:shadow-lg">
        <upload-icon class="w-5 mr-1" />
        上传文件
      </button>
      <button @click="newDir" class="all-transition m-1 border border-gray-300 rounded-full p-2 hover:bg-gray-100 text-sm"><folder-add-icon class="w-5" /></button>
    </div>
    <p v-if="uploading" class="text-gray-500 text-sm">正在上传 {{ uploading }}</p>
    <div class="my-3 text-gray-500"><!-- breadcrumb -->
      <span class="cursor-pointer hover:underline" :class="!breadcrumb.length && 'text-black font-bold'" @click="gotoBreadcrumb(-1)">我的云盘</span>
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
              <img src="icon/return.png" class="w-6">
              <div class="mx-2 text-sm">返回上级目录</div>
            </div>
          </td>
          <td></td>
        </tr>
        <tr v-for="n in displayNodes" class="all-transition border border-x-0 cursor-pointer group" :class="rowClass(n)" @dblclick="open(n)" @click="select(n)">
          <td class="h-12 flex items-center">
            <img :src="selected[n._id] ? 'icon/check.svg' : (icon[n.type.toLowerCase()] || 'icon/file.svg')" class="w-6 mx-1">
            <div class="flex items-center px-1" :class="edit[n._id] && 'border bg-white'">
              <div :id="'name_' + n._id" :contenteditable="edit[n._id]" class="text-sm mr-2 whitespace-nowrap overflow-hidden node-name" @keydown.enter.prevent="rename(n)">{{ n.name }}</div>
              <check-icon v-if="edit[n._id]" class="w-4 text-blue-500" @click.stop="rename(n)" />
              <pencil-icon v-else @click.stop="edit[n._id] = true" class="invisible group-hover:visible w-4 text-gray-500" />
            </div>
          </td>
          <td class="text-center text-gray-500 text-sm w-10 sm:w-48">
            <div class="hidden sm:block group-hover:hidden">{{ time2Str(n.time) }}</div>
            <div class="flex sm:hidden group-hover:flex items-center justify-center px-2">
              <login-icon class="w-5 mr-1 text-gray-500" @click.stop="moving = n" />
              <link-icon class="w-5 mr-1 text-blue-500" @click.stop="copy(n)" />
              <trash-icon class="w-5 text-red-500" @click.stop="remove(n)" />
            </div>
          </td>
        </tr>
      </table>
      <div v-if="!nodes.length" class="mt-20 w-full flex flex-col items-center justify-center">
        <img src="icon/cloud.svg" >
        <p class="text-gray-500 text-sm">白云一片去悠悠，这里什么也没有</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-name {
  max-width: calc(100vw - 24rem);
}
@media (max-width: 640px) {
  .node-name {
    max-width: calc(100vw - 12rem);
  }
}
</style>
