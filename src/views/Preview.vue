<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
const nid = route.params.nid, token = route.params.token
const src = "https://s.yzzx.org/disk/#/card/" + nid + "?token" + token
</script>

<template>
  <iframe :src="src"></iframe>
</template>
