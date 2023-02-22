<script setup>
import moment from 'moment'
import icon from '../utils/icon.js'
import { PencilIcon, CheckIcon, ArrowRightOnRectangleIcon, LinkIcon, TrashIcon } from '@heroicons/vue/24/outline'
const props = defineProps(['node', 'selected', 'moving', 'editable'])
const emits = defineEmits(['open', 'select', 'rename', 'move', 'link', 'remove'])
let n = $computed(() => props.node)
let type = $computed(() => n.type.toLowerCase())
let edit = $ref(false), input = $ref(), copyInput = $ref()

function rename () {
  edit = false
  const name = input.innerHTML
  if (!name.match(/\S/) || name === n.name) return input.innerHTML = n.name
  emits('rename', n, name)
}

const time2Str = t => moment(t).format('YYYY-MM-DD HH:mm:ss')

let rowClass = $computed(() => {
  let res = props.selected ? 'bg-blue-100' : 'hover:bg-gray-100'
  if (props.moving) res += ' opacity-50'
  return res
})

function copy () {
  copyInput.setAttribute('type', 'text')
  const base = window.location.origin + window.location.pathname + '#'
  copyInput.value = base + '/preview/' + n._id
  copyInput.select()
  document.execCommand('copy')
  copyInput.setAttribute('type', 'hidden')
  window.getSelection().removeAllRanges()
  Swal.fire('链接已复制', '链接具有访问权限，请谨慎使用', 'success')
}
</script>

<template>
  <input type="hidden" ref="copyInput">
  <tr class="all-transition border border-x-0 cursor-pointer group" :class="rowClass" @dblclick="emits('open')" @click="emits('select')">
    <td class="h-12 flex items-center">
      <img :src="props.selected ? 'icon/check.svg' : (icon[type] || 'icon/file.svg')" class="w-6 mx-1">
      <div class="flex items-center px-1" :class="edit && 'border bg-white'">
        <div ref="input" :contenteditable="edit" class="text-sm mr-2 whitespace-nowrap overflow-hidden" :class="props.editable ? 'node-name-editable' : 'node-name'" @keydown.enter.prevent="rename">{{ n.name }}</div>
        <CheckIcon v-if="edit" class="w-4 text-blue-500" @click.stop="rename" />
        <PencilIcon v-if="props.editable && !edit" @click.stop="edit = true" class="invisible group-hover:visible w-4 text-gray-500" />
      </div>
    </td>
    <td class="text-center text-gray-500 text-sm w-10 sm:w-48">
      <div class="hidden sm:block group-hover:hidden">{{ time2Str(n.time) }}</div>
      <div class="flex sm:hidden group-hover:flex items-center justify-center px-2">
        <button @click.stop="emits('move')" title="移动">
          <ArrowRightOnRectangleIcon v-if="props.editable" class="w-5 mr-1 text-gray-500" />
        </button>
        <button @click.stop="copy" title="复制链接">
          <LinkIcon class="w-5 mr-1 text-blue-500" />
        </button>
        <button class="w-5 text-red-500" title="删除">
          <TrashIcon v-if="props.editable" @click.stop="emits('remove')" />
        </button>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.node-name-editable {
  max-width: calc(100vw - 20rem);
}
.node-name {
  max-width: calc(100vw - 18rem);
}
@media (max-width: 640px) {
  .node-name-editable {
    max-width: calc(100vw - 12rem);
  }
  .node-name {
    max-width: calc(100vw - 8rem);
  }
}
</style>
