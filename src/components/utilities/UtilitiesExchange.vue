<script setup lang="ts">
import { computed, ref, Ref, nextTick } from 'vue'
import { useCoreStore, Token } from '../../store/core'
import { useActionStore } from '../../store/action'
import { convertFromDecimals, standardiseDecimals } from '../../utils/bn'
import { watchPausable } from '@vueuse/core'

const core = useCoreStore()
const actionStore = useActionStore()

const loading = ref(false)
const token0: Ref<Token> = ref({ address: '', name: '', symbol: '', decimals: 18 })
const token1: Ref<Token> = ref({ address: '', name: '', symbol: '', decimals: 18 })
const amount0 = ref(0)
const amount1 = ref(0)
const tokens = computed(() => core.availableTokens)

const { pause: pauseToken0Update, resume: resumeToken0Update } = watchPausable(amount0, async () => {
    if (token0.value.address === '') return
    pauseToken1Update()
    const quote = await core.getUniswapV3Quote(token0.value, token1.value, convertFromDecimals(amount0.value, token0.value.decimals))
    amount1.value = standardiseDecimals(quote[0], token1.value.decimals)
    await nextTick()
    resumeToken1Update()
})

const { pause: pauseToken1Update, resume: resumeToken1Update } = watchPausable(amount1, async () => {
    if (token1.value.address === '') return
    pauseToken0Update()
    
    await nextTick()
    resumeToken0Update()
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
            // token, amount, amoutnOutMin, path
            calldata: [token0.value.address, convertFromDecimals(amount0.value, token0.value.decimals), convertFromDecimals(amount1.value * 0.98, token1.value.decimals), ''],
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
            <label class="label error">
                <span class="label-text-alt"></span>
                <span class="label-text-alt text-error">{{ error }}</span>
            </label>
            <div class="card-actions justify-end">
                <button class="btn btn-primary" :disabled="error !== null || loading" @click="addAction">Add Action <span v-if="loading" class="loading loading-spinner"></span></button>
            </div>
        </div>
    </div>
</template>