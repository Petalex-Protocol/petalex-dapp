<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useCoreStore } from '../../store/core'
import { chain, account } from '@kolirt/vue-web3-auth'

const core = useCoreStore()

const loading = ref(false)

const init = async () => {
    if (!loading.value) {
        try {
            if (account.connected) {
                loading.value = true
                await core.getGeneralTokenInfo()
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
    <RouterView />
</template>