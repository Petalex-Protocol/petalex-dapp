<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCoreStore } from '../../store/core'

const core = useCoreStore()
const ownedTokens = computed(() => core.ownedTokens || [])
const selectedToken = computed(() => core.selectedToken)
const loading = ref(false)

const select = async (tokenId: number) => {
    loading.value = true
    try {
        await core.selectToken(tokenId)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div>
        <div class="text-center">
            <h2 class="text-2xl font-bold">Select NFT!</h2>
            <p class="text-lg">Select the NFT you wish to act as your proxy wallet</p>
        </div>
        <div class="text-center my-4" v-if="ownedTokens.length > 0">
            You currently have {{ ownedTokens.length }} NFT{{ ownedTokens.length > 1 ? 's' : '' }}          
        </div>
        <div class="card w-[500px] bg-base-200 shadow-xl mx-auto my-4">
            <div class="card-body">
                <h2 class="card-title">Available NFTs</h2>
                <div v-for="t in ownedTokens">
                    <div class="flex flex-row items-center">
                        <div class="flex flex-col">
                            <div class="text-lg font-bold text-white">Token {{ t }}</div>
                        </div>
                        <div class="flex-grow"></div>
                        <div class="flex flex-col">
                            <button v-if="t !== selectedToken" class="btn btn-primary"  :disabled="loading" @click="select(t)">Select <span v-if="loading" class="loading loading-spinner"></span></button>
                            <button v-else class="btn btn-primary" disabled>Active <span v-if="loading" class="loading loading-spinner"></span></button>
                        </div>
                    </div>
                </div>
                <div v-if="ownedTokens.length === 0" class="text-center my-4">
                    <p class="text-lg">You do not have any NFTs, please <router-link to="/mint">Mint</router-link> one.</p>
                </div>
            </div>
        </div>
    </div>
</template>