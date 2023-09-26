<script setup lang="ts">
import { computed, ref, Ref } from 'vue'
import { useCoreStore, Token, NATIVE_ADDRESS } from '../../store/core'
import { ActionType, Location, useActionStore } from '../../store/action'
import { convertFromDecimals } from '../../utils/bn'
import { AbiCoder } from 'ethers';

const core = useCoreStore()
const actionStore = useActionStore()

const feeOptions = [100, 500, 3000, 10000]

const loading = ref(false)
const token0: Ref<Token> = ref({ address: '', name: '', symbol: '', decimals: 18, price: '0', balanceOf: '0', balanceOfProxy: '0', allowance: BigInt(0) })
const token1: Ref<Token> = ref({ address: '', name: '', symbol: '', decimals: 18, price: '0', balanceOf: '0', balanceOfProxy: '0', allowance: BigInt(0) })
const amount0 = ref(0)
const amount1 = ref(0)
const fee = ref(3000)
const tokens = computed(() => core.availableTokens.filter(x => x.address !== NATIVE_ADDRESS))

const error = computed(() => {
    if (amount0.value === 0 && amount1.value === 0) return 'Must specify an amount on at least one token'
    if (token0.value.address === '' || token1.value.address === '') return 'Must specify a token'
    if (token0.value.address === token1.value.address) return 'Tokens must be different'
    if (actionStore.getActions.some(x => x.type === ActionType.Flash)) return 'Only one flash loan action is allowed at a time'
    return null
})

const addAction = async () => {
    amount0.value = Number(amount0.value)
    amount1.value = Number(amount1.value)
    if (amount0.value === 0 && amount1.value === 0) return
    loading.value = true
    try {
        const poolAddress = await core.getPoolAddress(token0.value, token1.value, fee.value)
        const isBefore = token0.value.address.toLowerCase() < token1.value.address.toLowerCase()
        const token0Param = isBefore ? token0.value : token1.value
        const token1Param = isBefore ? token1.value : token0.value
        const amount0Param = isBefore ? amount0.value : amount1.value
        const amount1Param = isBefore ? amount1.value : amount0.value

        actionStore.spliceAction({
            type: ActionType.Flash,
            displayName: 'Flash Loan',
            // token0, token1, pool address, amount0, amount1
            data: [token0.value.address, token1.value.address, poolAddress, convertFromDecimals(amount0.value, token0.value.decimals), convertFromDecimals(amount1.value, token1.value.decimals)],
            calldata: AbiCoder.defaultAbiCoder().encode(['address', 'address', 'address', 'uint256', 'uint256'], [token0Param.address, token1Param.address, poolAddress, convertFromDecimals(amount0Param, token0Param.decimals), convertFromDecimals(amount1Param, token1Param.decimals)]),
            balanceChanges: [{
                symbol: token0.value.symbol,
                address: token0.value.address,
                decimals: token0.value.decimals,
                amount: convertFromDecimals(amount0.value, token0.value.decimals),
                location: Location.proxy,
            }, {
                symbol: token1.value.symbol,
                address: token1.value.address,
                decimals: token1.value.decimals,
                amount: convertFromDecimals(amount1.value, token1.value.decimals),
                location: Location.proxy,
            }],
        }, 0) // always the first index

        actionStore.spliceAction({
            type: ActionType.FlashReturn,
            displayName: 'Flash Loan Return',
            // token0, token1, pool address, amount0, amount1
            calldata: AbiCoder.defaultAbiCoder().encode(['address', 'address', 'address', 'uint256', 'uint256'], [token0Param.address, token1Param.address, poolAddress, convertFromDecimals(amount0Param, token0Param.decimals), convertFromDecimals(amount1Param, token1Param.decimals)]),
            balanceChanges: [{
                symbol: token0.value.symbol,
                address: token0.value.address,
                decimals: token0.value.decimals,
                amount: convertFromDecimals(amount0.value + (amount0.value * (fee.value / 1000000)), token0.value.decimals) * BigInt(-1),
                location: Location.proxy,
            }, {
                symbol: token1.value.symbol,
                address: token1.value.address,
                decimals: token1.value.decimals,
                amount: convertFromDecimals(amount1.value + (amount1.value * (fee.value / 1000000)), token1.value.decimals) * BigInt(-1),
                location: Location.proxy,
            }],
            data: [fee.value, convertFromDecimals(amount0Param + (amount0Param * (fee.value / 1000000)), token0Param.decimals), convertFromDecimals(amount1Param + (amount1Param * (fee.value / 1000000)), token1Param.decimals), token0Param.address, token1Param.address]
        }, actionStore.actions.length) // always the last index
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="card w-[500px] bg-base-200 shadow-xl mx-auto">
        <div class="card-body">
            <h2 class="card-title">Flash Loan</h2>
            <div class="join">
                <input class="input input-bordered join-item w-full" v-model="amount0"/>
                <select class="select select-bordered join-item" v-model="token0">
                    <option v-for="token in tokens" :key="token.address" :value="token">
                        {{ token.symbol }}
                    </option>
                </select>
            </div>
            <div class="join">
                <input class="input input-bordered join-item w-full" v-model="amount1"/>
                <select class="select select-bordered join-item" v-model="token1">
                    <option v-for="token in tokens" :key="token.address" :value="token">
                        {{ token.symbol }}
                    </option>
                </select>
            </div>
            <div class="flex gap-1 justify-between">
                <div v-for="f in feeOptions" :key="f">
                    <label class="label cursor-pointer">
                        <span class="label-text me-2">{{ f / 10000 }}%</span> 
                        <input v-model="fee" type="radio" class="radio gap-1" name="fee" :value="f" />
                    </label>
                </div>
            </div>
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