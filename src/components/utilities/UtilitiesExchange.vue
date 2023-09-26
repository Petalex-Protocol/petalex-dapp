<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCoreStore, Token, NATIVE_ADDRESS } from '../../store/core'
import { ActionType, Location, useActionStore } from '../../store/action'
import { convertFromDecimals, standardiseDecimals } from '../../utils/bn'
import { useDebounceFn } from '@vueuse/core'
import { AbiCoder } from 'ethers'

const core = useCoreStore()
const actionStore = useActionStore()

const loading = ref(false)
const token0 = ref<Token>({ address: '', name: '', symbol: '', decimals: 18, price: '0', balanceOf: '0', balanceOfProxy: '0', allowance: BigInt(0) })
const token1 = ref<Token>({ address: '', name: '', symbol: '', decimals: 18, price: '0', balanceOf: '0', balanceOfProxy: '0', allowance: BigInt(0) })
const intermediateTokens = ref<Token[]>([])
const amount0 = ref(0)
const amount1 = ref(0)
const tokens = computed(() => core.availableTokens.filter(x => x.address !== NATIVE_ADDRESS))
const chosenPath = ref<any[]>([])
const chosenPathCallData = ref<string>('')
const bestPriceImpact = ref(0)
const slippage = ref(0.5)

const pathText = computed(() => {
    let text = `${token0.value.symbol} `
    for (let i = 0; i < chosenPath.value.length; i++) {
        text += `${chosenPath.value[i] / 10000}% -> ${intermediateTokens.value[i]?.symbol || token1.value.symbol} `
    }    
    return text
})

const calculateAmounts = async (input: boolean) => {
    if (loading.value || token0.value.address === '' || token1.value.address === '') return
    if (token0.value.address === token1.value.address) return
    if (intermediateTokens.value.some(token => token.address === '')) return
    if (intermediateTokens.value.some(token => token.address === token0.value.address || token.address === token1.value.address)) return
    if (input && !amount0.value) return
    if (!input && !amount1.value) return

    loading.value = true
    const { quote, path, pathCallData, priceImpact } = await core.getUniswapV3Quote(token0.value, token1.value, input ? amount0.value : amount1.value, input, intermediateTokens.value)
    if (input) {
        amount1.value = standardiseDecimals(quote.toString(), token1.value.decimals)
    } else {
        amount0.value = standardiseDecimals(quote.toString(), token0.value.decimals)
    }
    chosenPathCallData.value = pathCallData
    chosenPath.value = path
    bestPriceImpact.value = Number(priceImpact)
    loading.value = false
}

const calculateAmountsDebounced = useDebounceFn(calculateAmounts, 500)

const error = computed(() => {
    if (amount0.value === 0 && amount1.value === 0) return 'Must specify an amount on at least one token'
    if (token0.value.address === '' || token1.value.address === '' || intermediateTokens.value.some(token => token.address === '')) return 'Must specify a token'
    if (token0.value.address === token1.value.address || intermediateTokens.value.some(token => token.address === token0.value.address || token.address === token1.value.address)) return 'Tokens must be different'
    return null
})

const addAction = async () => {
    amount0.value = Number(amount0.value)
    amount1.value = Number(amount1.value)
    if (amount0.value === 0 && amount1.value === 0) return
    loading.value = true
    try {
        actionStore.spliceAction({
            type: ActionType.UniswapV3ExactInput,
            displayName: 'Exchange',
            // token, amount, amoutnOutMin, path
            data: [token0.value.address, convertFromDecimals(amount0.value, token0.value.decimals), convertFromDecimals(amount1.value * ((100 - slippage.value) / 100), token1.value.decimals), chosenPathCallData.value],
            calldata: AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'uint256', 'bytes'], [token0.value.address, convertFromDecimals(amount0.value, token0.value.decimals), convertFromDecimals(amount1.value * ((100 - slippage.value) / 100), token1.value.decimals), chosenPathCallData.value]),
            balanceChanges: [{
                symbol: token0.value.symbol,
                address: token0.value.address,
                decimals: token0.value.decimals,
                amount: convertFromDecimals(amount0.value, token0.value.decimals) * BigInt(-1),
                location: Location.proxy,
            }, {
                symbol: token1.value.symbol,
                address: token1.value.address,
                decimals: token1.value.decimals,
                amount: convertFromDecimals(amount1.value, token1.value.decimals),
                location: Location.proxy,
            }],
        }, actionStore.actions.length)
    } finally {
        loading.value = false
    }
}

const addHop = () => {
    intermediateTokens.value.push({ address: '', name: '', symbol: '', decimals: 18, price: '0', balanceOf: '0', balanceOfProxy: '0', allowance: BigInt(0) })
}
</script>

<template>
    <div class="card w-[500px] bg-base-200 shadow-xl mx-auto">
        <div class="card-body">
            <h2 class="card-title">Exchange</h2>
            <div class="join">
                <input class="input input-bordered join-item w-full" v-model="amount0" @input="calculateAmountsDebounced(true)"/>
                <select class="select select-bordered join-item" v-model="token0" @change="calculateAmounts(true)">
                    <option v-for="token in tokens" :key="token.address" :value="token">
                        {{ token.symbol }}
                    </option>
                </select>
            </div>
            <div v-for="(_, i) in intermediateTokens">
                <select class="select select-bordered w-full" v-model="intermediateTokens[i]" @change="calculateAmounts(true)">
                    <option v-for="token in tokens" :key="token.address" :value="token">
                        {{ token.symbol }}
                    </option>
                </select>
            </div>
            <div class="join">
                <input class="input input-bordered join-item w-full" v-model="amount1" @input="calculateAmountsDebounced(false)"/>
                <select class="select select-bordered join-item" v-model="token1" @change="calculateAmounts(true)">
                    <option v-for="token in tokens" :key="token.address" :value="token">
                        {{ token.symbol }}
                    </option>
                </select>
            </div>
            <label v-if="chosenPath.length > 0" class="label">
                <span class="label-text-alt"></span>
                <span class="label-text-alt">Best route - {{ pathText }}</span> 
            </label>
            <label v-if="chosenPath.length > 0" class="label">
                <span class="label-text-alt"></span>
                <span class="label-text-alt flex gap-1">Price Impact: {{ bestPriceImpact.toFixed(3) }}%
                    <span class="tooltip" data-tip="Price impact measured from aggregated market price">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                    </span>
                </span> 
            </label>
            <label v-if="error" class="label error">
                <span class="label-text-alt"></span>
                <span class="label-text-alt text-error">{{ error }}</span>
            </label>
            <div class="card-actions justify-end">
                <button class="btn btn-secondary" :disabled="loading" @click="addHop">Add Hop</button>
                <button class="btn btn-primary" :disabled="error !== null || loading" @click="addAction">Add Action <span v-if="loading" class="loading loading-spinner"></span></button>
            </div>
        </div>
    </div>
</template>