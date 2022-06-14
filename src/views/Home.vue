<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter(), route = useRoute()
const SS = window.sessionStorage

async function getDir (nid) {
}

async function init () {
  // Todo: fetch root
}

if (SS.token) init()
else router.push('/login')
</script>

<template>
  
</template>