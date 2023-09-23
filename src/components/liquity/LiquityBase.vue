<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useCoreStore } from '../../store/core'
import { chain, account } from '@kolirt/vue-web3-auth'
import { useRoute, useRouter } from 'vue-router'
import ComingSoon from '../common/ComingSoon.vue';

const core = useCoreStore()
const route = useRoute()
const router = useRouter()

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

watch([chain, account], init)

onMounted(init)
</script>

<template>
    <ComingSoon />
    <RouterView />
</template>