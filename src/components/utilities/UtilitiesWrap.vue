<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCoreStore } from '../../store/core'
import { Location, useActionStore } from '../../store/action'
import { convertFromDecimals, standardiseDecimals } from '../../utils/bn';

const core = useCoreStore()
const actionStore = useActionStore()

const loading = ref(false)
const amount = ref(0)
const wethToken = computed(() => core.availableTokens.find(x => x.symbol === 'WETH') || null)
const ethToken = computed(() => core.availableTokens.find(x => x.symbol === 'ETH') || null)

const error = computed(() => {
    if (amount.value === 0) return 'Must specify an amount'
    return null
})

const addAction = async () => {
    amount.value = Number(amount.value)
    if (amount.value === 0) return
    if (!wethToken.value || !ethToken.value) return
    loading.value = true
    try {
        actionStore.spliceAction({
            name: 'Wrap',
            displayName: 'Wrap',
            // amount
            calldata: [convertFromDecimals(amount.value, ethToken.value.decimals)],
            balanceChanges: [{
                symbol: ethToken.value?.symbol,
                address: ethToken.value.address,
                amount: amount.value * -1,
                location: Location.proxy,
            }, {
                symbol: wethToken.value.symbol,
                address: wethToken.value.address,
                amount: amount.value,
                location: Location.proxy,
            }],
        }, actionStore.actions.length)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="card w-[500px] bg-base-200 shadow-xl mx-auto">
        <div class="card-body">
            <h2 class="card-title">Wrap</h2>
            <div class="join">
                <input class="input input-bordered join-item w-full" v-model="amount" />
                <input class="input input-bordered join-item w-[80px]" disabled value="ETH" />
            </div>
            <label class="label">
                <span class="label-text-alt"></span>
                <span class="label-text-alt cursor-pointer" @click="amount = standardiseDecimals(ethToken?.balanceOf, ethToken?.decimals || 18)">Available: {{ standardiseDecimals(ethToken?.balanceOf, ethToken?.decimals || 18).toFixed(2) }} {{ ethToken?.symbol }}</span>
            </label>
            <label v-if="error" class="label error">
                <span class="label-text-alt"></span>
                <span class="label-text-alt text-error">{{ error }}</span>
            </label>
            <div class="card-actions justify-end">
                <button class="btn btn-primary" :disabled="error !== null || loading" @click="addAction">Add Action <span v-if="loading" class="loading loading-spinner"></span></button>
            </div>
        </div>
    </div>
</template>