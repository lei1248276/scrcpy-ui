<template>
  <img
    alt="logo"
    class="logo"
    src="./assets/electron.svg"
  >

  <input
    v-model="ip"
    type="text"
  >

  <div class="actions">
    <div class="action">
      <a
        href="https://electron-vite.org/"
        target="_blank"
        rel="noreferrer"
      >Documentation</a>
    </div>

    <div class="action">
      <a
        target="_blank"
        rel="noreferrer"
        @click="onScrcpy(ip)"
      >Scrcpy Start</a>
    </div>

    <div class="action">
      <a
        target="_blank"
        rel="noreferrer"
        @click="onScrcpyKill"
      >Scrcpy Kill</a>
    </div>
  </div>
  <Versions />
</template>

<script setup lang="ts">
import Versions from './components/Versions.vue'
import { ref } from 'vue'

const ip = ref(localStorage.getItem('ip') || '')

const onScrcpy = (ip: string) => {
  localStorage.setItem('ip', ip)
  window.electron.ipcRenderer.send('scrcpy', ip)
}

const onScrcpyKill = () => {
  window.electron.ipcRenderer.send('scrcpy-kill')
}
</script>
