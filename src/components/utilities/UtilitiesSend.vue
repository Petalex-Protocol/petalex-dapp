<script setup lang="ts">
import { computed, ref } from 'vue'
import { Token, useCoreStore } from '../../store/core'
import { ActionType, Location, useActionStore } from '../../store/action'
import { convertFromDecimals, standardiseDecimals } from '../../utils/bn';
import { account } from '@kolirt/vue-web3-auth';
import { AbiCoder } from 'ethers';

const core = useCoreStore()
const actionStore = useActionStore()

const loading = ref(false)
const amount = ref(0)
const token = ref<Token>({ address: '', name: '', symbol: '', decimals: 18, price: '0', balanceOf: '0', balanceOfProxy: '0', allowance: BigInt(0) })
const tokens = computed(() => core.availableTokens)

const error = computed(() => {
    if (amount.value === 0) return 'Must specify an amount'
    return null
})

const addAction = async () => {
    amount.value = Number(amount.value)
    if (amount.value === 0) return
    if (token.value.address === '') return
    loading.value = true
    try {
        actionStore.spliceAction({
            type: ActionType.Send,
            displayName: 'Send',
            // token, to address, amount
            data: [token.value.address, account.address, convertFromDecimals(amount.value, token.value.decimals)],
            calldata: AbiCoder.defaultAbiCoder().encode(['address', 'address', 'uint256'], [token.value.address, account.address, convertFromDecimals(amount.value, token.value.decimals)]),
            balanceChanges: [{
                symbol: token.value?.symbol,
                address: token.value.address,
                decimals: token.value.decimals,
                amount: convertFromDecimals(amount.value * -1, token.value.decimals),
                location: Location.proxy,
            }, {
                symbol: token.value.symbol,
                address: token.value.address,
                decimals: token.value.decimals,
                amount: convertFromDecimals(amount.value, token.value.decimals),
                location: Location.wallet,
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
            <h2 class="card-title">Transfer from Proxy</h2>
            <p class="text">Send funds from your proxy wallet to your address</p>
            <div class="join">
                <input class="input input-bordered join-item w-full" v-model="amount" />
                <select class="select select-bordered join-item" v-model="token">
                    <option v-for="token in tokens" :key="token.address" :value="token">
                        {{ token.symbol }}
                    </option>
                </select>
            </div>
            <label class="label">
                <span class="label-text-alt"></span>
                <span class="label-text-alt cursor-pointer" @click="amount = standardiseDecimals(token?.balanceOfProxy, token?.decimals || 18)">Available: {{ standardiseDecimals(token?.balanceOfProxy, token?.decimals || 18).toFixed(2) }} {{ token?.symbol }}</span>
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