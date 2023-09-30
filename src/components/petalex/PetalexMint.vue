<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCoreStore } from '../../store/core'
import { useAppStore } from '../../store/app'
import { convertFromDecimals } from '../../utils/bn'
import { account } from '@kolirt/vue-web3-auth';
import { useRouter } from 'vue-router';

const core = useCoreStore()
const app = useAppStore()
const router = useRouter()
const ownedTokens = computed(() => core.ownedTokens || [])
const amount = ref(1)
const donation = ref(0.1)

const loading = ref(false)

const mint = async () => {
    let id = -1
    try {
        loading.value = true
        const data = await core.mintProxyWallets(amount.value, convertFromDecimals(donation.value, 18))
        id = app.addToast('Minting NFTs...', 'alert-info', 0)
        await data?.wait()
        await core.getPetalexInfo(account.address?.toString() || '')
        router.push('/select')
    } catch (error) {  
        app.addToast('Error minting NFTs', 'alert-error', 5000)      
        console.log(error)
    } finally {
        app.removeToast(id)
        loading.value = false
    }    
}

const error = computed(() => {
    if (isNaN(amount.value) || amount.value < 1 || amount.value > 10) {
        return 'Amount must be between 1 and 10'
    }
    if (isNaN(donation.value) || donation.value < 0) {
        return 'Donation must be a positive number or 0'
    }
    return null
})
</script>

<template>
    <div>
        <img src="/src/assets/petalex-plant.png" width="500" class="mx-auto" />
        <div class="text-center">
            <h2 class="text-2xl font-bold">Welcome to Petalex!</h2>
            <p class="text-lg">Mint your proxy wallets below</p>
        </div>
        <div class="text-center my-4" v-if="ownedTokens.length > 0">
            You currently have {{ ownedTokens.length }} NFT{{ ownedTokens.length > 1 ? 's' : '' }}          
        </div>
        <div class="card w-[500px] bg-base-200 shadow-xl mx-auto my-4">
            <div class="card-body">
                <h2 class="card-title">Mint NFT Proxy Wallets</h2>
                <div class="join">
                    <input class="input input-bordered join-item w-full" type="number" min="1" max="10" v-model="amount"/>
                </div>
                <label class="label">
                    Optional Donation
                </label>
                <div class="join">
                    <input class="input input-bordered join-item w-full" :class="{'input-error': error}" v-model="donation"/>
                    <input class="input input-bordered join-item w-[80px]" disabled value="ETH" />
                </div>
                <label class="label error">
                    <span class="label-text-alt"></span>
                    <span class="label-text-alt text-error">{{ error }}</span>
                </label>
                <div class="card-actions justify-end">
                    <button class="btn btn-primary" :disabled="error !== null || loading" @click="mint">Mint {{ amount }} NFT{{ amount > 1 ? 's' : '' }} <span v-if="loading" class="loading loading-spinner"></span></button>
                </div>
            </div>
        </div>
    </div>
</template>