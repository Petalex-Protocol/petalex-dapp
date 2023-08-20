<script setup lang="ts">
import { onMounted } from "vue"
import { useAppStore } from "./store/app"
import Header from "./components/Header.vue";
import Sidebar from "./components/Sidebar.vue";

const appStore = useAppStore()

const setPreferredColorScheme = () => {
    if (appStore.theme === "notheme") {
        if (
            "matchMedia" in window &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            appStore.setTheme("dark")
        } else {
            appStore.setTheme("light")
        }
    }
}

onMounted(() => {
    setPreferredColorScheme()
})
</script>

<template>
  <div :data-theme="appStore.theme" class="min-h-screen">
    <Header />
    <Sidebar />
  </div>
</template>

<style scoped>
</style>
