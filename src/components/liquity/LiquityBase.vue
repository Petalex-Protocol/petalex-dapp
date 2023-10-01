<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useCoreStore } from '../../store/core'
import { chain, account } from '@kolirt/vue-web3-auth'
import { useRoute, useRouter } from 'vue-router'
import ComingSoon from '../common/ComingSoon.vue'
import { useAppStore } from '../../store/app'
import liquityDark from '@/assets/liquity_dark.png'
import liquityLight from '@/assets/liquity_light.png'

const core = useCoreStore()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const loading = ref(false)

const init = async () => {
    if (route.meta.requiresMint && core.ownedTokens.length === 0) {
        router.push('/mint')
    }
    if (!loading.value) {
        try {
            if (account.connected) {
                loading.value = true
            }
        } catch (error) {
            console.log(error)
        } finally {
            loading.value = false
        }
    }
}

const image = computed(() => {
    return appStore.theme === 'light' ? liquityDark : liquityLight
})

watch([chain, account], init)

onMounted(init)
</script>

<template>
    <img :src="image" width="500" class="mx-auto mb-10" />
    <ComingSoon />
    <RouterView />
</template>