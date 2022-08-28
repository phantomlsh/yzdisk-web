<script setup>
import ItemRow from '../components/ItemRow.vue'
import request from '../utils/request.js'
import { useRoute } from 'vue-router'
const route = useRoute()
let token = $ref(''), showTip = $ref(true), nodes = $ref(null)
let tip = $computed(() => {
  if (!token) return '身份验证失败'
  if (!nodes) return '正在载入...'
  if (!Object.keys(nodes).length) return '无内容'
})

async function init () {
  if (!route.query.token) return
  token = route.query.token
  nodes = await request.get('/yzdisk/query/' + route.params.ids, { headers: { token } })
  if (Object.keys(nodes).length) showTip = false
}
init()
</script>

<template>
  <transition name="fade" mode="out-in">
    <div v-if="showTip" class="w-full flex items-center px-2 my-2">
      <img :src="'icon/cloud.svg'" class="w-20 mr-2">
      <h1 class="text-xl">{{ tip }}</h1>
    </div>
    <table v-else class="table w-full">
      <ItemRow v-for="n in nodes"
        :node="n" :selected="false" :moving="false" :editable="false"
      />
    </table>
  </transition>
</template>
