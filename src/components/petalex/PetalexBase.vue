<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { Address, useCoreStore } from '../../store/core'
import { useAppStore } from '../../store/app'
import NetworkUnsupported from '../common/NetworkUnsupported.vue'
import { chain, account, connect } from '@kolirt/vue-web3-auth'
import { useRoute, useRouter } from 'vue-router'

const core = useCoreStore()
const app = useAppStore()
const route = useRoute()
const router = useRouter()

const toasts = computed(() => app.toasts)
const petalexAddress = computed(() => core.getAddress(Address.petalexNft))

const loading = ref(false)

const init = async () => {
    if (!loading.value) {
        try {
            if (account.connected && account.address) {
                loading.value = true
                await core.getPetalexInfo(account.address)
                if (route.meta.requiresMint && core.ownedTokens.length === 0) {
                    router.push('/mint')
                }
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
    <div v-for="toast in toasts" :key="toast.id" class="toast toast-top toast-end" >
        <div class="alert" :class="toast.class">
            <span>{{ toast.text }}</span>
        </div>
    </div>
    <div v-if="petalexAddress && account.connected">
        <RouterView />
    </div>
    <div v-else-if="!account.connected">
        <div class="text-center">
            <h2 class="text-2xl font-bold">Welcome to Petalex!</h2>
            <p class="text-lg">Connect your wallet below</p>
        </div>
        <div class="text-center my-4">
            <button class="btn btn-primary" @click="connect()">Connect Wallet</button>
        </div>
    </div>
    <div v-else>
        <NetworkUnsupported message="Petalex is not deployed on the current network yet" />
    </div>
</template>