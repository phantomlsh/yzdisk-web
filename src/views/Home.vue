<script setup>
import moment from 'moment'
import request from '../utils/request.js'
import icon from '../utils/icon.js'
import { UploadIcon, FolderAddIcon, PencilIcon, CheckIcon, LockClosedIcon, TrashIcon } from '@heroicons/vue/outline'
import { useRouter } from 'vue-router'
const router = useRouter()
const SS = window.sessionStorage
const opt = () => ({ headers: { token: SS.token } })

let nodes = $ref([])
let breadcrumb = $ref([]), edit = $ref({}), uploading = $ref('')
if (yzdisk.dir) breadcrumb.push({ _id: yzdisk.dir, name: '链接目录' })

async function getDir () {
  const res = await request.get('/yzdisk/dir/' + (yzdisk.dir || ''), opt())
  if (!res) return false
  return nodes = res
}

async function newDir () {
  const res = await request.post('/yzdisk/dir', { name: '新建文件夹', dir: yzdisk.dir || '' }, opt())
  if (!res) return
  nodes.push({ _id: res, type: '.', name: '新建文件夹', time: Date.now(), private: false })
  edit[res] = true
}

if (SS.token) getDir()
else router.push('/@')

// display

const time2Str = t => moment(t).format('YYYY-MM-DD HH:mm:ss')
const short = x => x.length < 10 ? x : (x.substring(0, 8) + '...')

let displayNodes = $computed(() => nodes.sort((x, y) => {
  if (x.type === '.' && y.type !== '.') return -1
  if (y.type === '.' && x.type !== '.') return 1
  return x.name.toLowerCase() < y.name.toLowerCase() ? -1 : 1
}))

// file operations

let fileInput = $ref()

function getType (name) {
  const ns = name.split('.')
  ns.shift()
  return ns.pop() || ''
}

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

// navigation functions

async function goto (nid) {
  yzdisk.dir = nid || ''
  await getDir()
}

async function open (n) {
  if (n.type === '.') { // goto dir
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

async function lock (n) {
  if (!n.private) {
    const { isConfirmed } = await Swal.fire({
      title: '确认改为私有',
      html: '私有文件或目录不能通过链接访问，改为私有会终止其他系统和用户对该内容的访问权限，可能导致您在其他系统上的文件失效',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '确认',
      confirmButtonColor: '#D22B2B',
      cancelButtonText: '取消'
    })
    if (!isConfirmed) return
  }
  const res = await request.put(`/yzdisk/${n.type === '.' ? 'dir' : 'file'}/${n._id}`, { private: !n.private }, opt())
  if (!res) return
  n.private = !n.private
}

async function remove (n) {
  const isFile = (n.type !== '.')
  const { isConfirmed } = await Swal.fire({
    title: '确认删除' + (isFile ? '文件' : '目录'),
    html: isFile ? `即将删除文件<code>${short(n.name)}</code>` : `即将删除目录<code>${short(n.name)}</code>的全部内容`,
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
</script>

<template>
  <input type="file" class="hidden" ref="fileInput" @change="upload(fileInput.files[0])">
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
          <td class="w-48"></td>
        </tr>
        <tr v-for="n in displayNodes" class="all-transition border border-x-0 cursor-pointer hover:bg-gray-100 group" @dblclick="open(n)">
          <td class="h-12 flex items-center">
            <img :src="icon[n.type.toLowerCase()] || 'icon/file.svg'" class="w-6 mx-1">
            <div class="flex items-center px-1" :class="edit[n._id] && 'border bg-white'">
              <div :id="'name_' + n._id" :contenteditable="edit[n._id]" class="text-sm mr-2 whitespace-nowrap overflow-hidden node-name" @keydown.enter.prevent="rename(n)">{{ n.name }}</div>
              <check-icon v-if="edit[n._id]" class="w-4 text-blue-500" @click.stop="rename(n)" />
              <pencil-icon v-else @click.stop="edit[n._id] = true" class="invisible group-hover:visible w-4 text-gray-500" />
            </div>
            <lock-closed-icon :class="n.private ? 'text-blue-500' : 'invisible'" class="group-hover:visible w-4 text-gray-500" @click.stop="lock(n)" />
          </td>
          <td class="text-center text-gray-500 text-sm w-6 sm:w-48">
            <div class="hidden sm:block group-hover:hidden">{{ time2Str(n.time) }}</div>
            <div class="hidden group-hover:flex items-center justify-center px-2">
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
    max-width: calc(100vw - 10rem);
  }
}
</style>
