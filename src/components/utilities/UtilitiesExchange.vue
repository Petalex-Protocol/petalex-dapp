<script setup lang="ts">
import { computed, ref, Ref, nextTick } from 'vue'
import { useCoreStore, Token } from '../../store/core'
import { useActionStore } from '../../store/action'
import { convertFromDecimals, standardiseDecimals } from '../../utils/bn'
import { watchPausable, refDebounced } from '@vueuse/core'
import { solidityPacked } from 'ethers'
import { sleep } from '../../utils/helpers'

const core = useCoreStore()
const actionStore = useActionStore()

const loading = ref(false)
const token0: Ref<Token> = ref({ address: '', name: '', symbol: '', decimals: 18 })
const token1: Ref<Token> = ref({ address: '', name: '', symbol: '', decimals: 18 })
const amount0 = ref(0)
const amount1 = ref(0)
const amount0Debounced = refDebounced(amount0, 500)
const amount1Debounced = refDebounced(amount1, 500)
const tokens = computed(() => core.availableTokens)
const chosenFee = ref(0)
const bestPriceImpact = ref(0)
const slippage = ref(0.5)

const { pause: pauseToken0Update, resume: resumeToken0Update } = watchPausable(amount0Debounced, async () => {
    if (token0.value.address === '' || token1.value.address === '' || !amount0.value) return
    if (token0.value.address === token1.value.address) return
    pauseToken1Update()
    pauseToken0SymbolUpdate()
    pauseToken1SymbolUpdate()
    loading.value = true
    const { quote, fee, priceImpact } = await core.getUniswapV3Quote(token0.value, token1.value, convertFromDecimals(amount0.value, token0.value.decimals), true)
    amount1.value = standardiseDecimals(quote.toString(), token1.value.decimals)
    chosenFee.value = fee
    bestPriceImpact.value = Number(priceImpact)
    loading.value = false
    await sleep(501)
    await nextTick()
    resumeToken1Update()
    resumeToken0SymbolUpdate()
    resumeToken1SymbolUpdate()
})

const { pause: pauseToken1Update, resume: resumeToken1Update } = watchPausable(amount1Debounced, async () => {
    if (token0.value.address === '' || token1.value.address === '' || !amount1.value) return
    if (token0.value.address === token1.value.address) return
    pauseToken0Update()
    pauseToken0SymbolUpdate()
    pauseToken1SymbolUpdate()
    loading.value = true
    const { quote, fee, priceImpact } = await core.getUniswapV3Quote(token0.value, token1.value, convertFromDecimals(amount1.value, token1.value.decimals), false)
    amount0.value = standardiseDecimals(quote.toString(), token0.value.decimals)
    chosenFee.value = fee
    bestPriceImpact.value = Number(priceImpact)
    loading.value = false
    await sleep(501)
    await nextTick()
    resumeToken0Update()
    resumeToken0SymbolUpdate()
    resumeToken1SymbolUpdate()
})

const { pause: pauseToken0SymbolUpdate, resume: resumeToken0SymbolUpdate } = watchPausable(token0, async () => {
    if (token0.value.address === '' || token1.value.address === '' || !amount0.value) return
    if (token0.value.address === token1.value.address) return
    pauseToken1Update()
    pauseToken0Update()
    pauseToken1SymbolUpdate()
    loading.value = true
    const { quote, fee, priceImpact } = await core.getUniswapV3Quote(token0.value, token1.value, convertFromDecimals(amount0.value, token0.value.decimals), true)
    amount1.value = standardiseDecimals(quote.toString(), token1.value.decimals)
    chosenFee.value = fee
    bestPriceImpact.value = Number(priceImpact)
    loading.value = false
    await sleep(501)
    await nextTick()
    resumeToken1Update()
    resumeToken0Update()
    resumeToken1SymbolUpdate()
})

const { pause: pauseToken1SymbolUpdate, resume: resumeToken1SymbolUpdate } = watchPausable(token1, async () => {
    if (token0.value.address === '' || token1.value.address === '' || !amount0.value) return
    if (token0.value.address === token1.value.address) return
    pauseToken1Update()
    pauseToken0Update()
    pauseToken0SymbolUpdate()
    loading.value = true
    const { quote, fee, priceImpact } = await core.getUniswapV3Quote(token0.value, token1.value, convertFromDecimals(amount0.value, token0.value.decimals), true)
    amount1.value = standardiseDecimals(quote.toString(), token1.value.decimals)
    chosenFee.value = fee
    bestPriceImpact.value = Number(priceImpact)
    loading.value = false
    await sleep(501)
    await nextTick()
    resumeToken1Update()
    resumeToken0Update()
    resumeToken0SymbolUpdate()
})


const error = computed(() => {
    if (amount0.value === 0 && amount1.value === 0) return 'Must specify an amount on at least one token'
    if (token0.value.address === '' || token1.value.address === '') return 'Must specify a token'
    if (token0.value.address === token1.value.address) return 'Tokens must be different'
    return null
})

const addAction = async () => {
    amount0.value = Number(amount0.value)
    amount1.value = Number(amount1.value)
    if (amount0.value === 0 && amount1.value === 0) return
    loading.value = true
    try {
        actionStore.spliceAction({
            name: 'UniswapV3ExactInput',
            displayName: 'Exchange',
            // token, amount, amountOutMin, path
            calldata: [token0.value.address, convertFromDecimals(amount0.value, token0.value.decimals), convertFromDecimals(amount1.value * ((100 - slippage.value) / 100), token1.value.decimals), solidityPacked(['address', 'uint24', 'address'], [token0.value.address, chosenFee.value, token1.value.address])],
            balanceChanges: [{
                symbol: token0.value.symbol,
                address: token0.value.address,
                amount: amount0.value * -1,
            }, {
                symbol: token1.value.symbol,
                address: token1.value.address,
                amount: amount1.value,
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
            <h2 class="card-title">Exchange</h2>
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
            <label v-if="chosenFee > 0" class="label">
                <span class="label-text-alt"></span>
                <span class="label-text-alt">Best liquidity found on {{ chosenFee / 10000 }}% fee pool</span> 
            </label>
            <label v-if="chosenFee > 0" class="label">
                <span class="label-text-alt"></span>
                <span class="label-text-alt">Price Impact: {{ bestPriceImpact / 10000 }}%</span> 
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