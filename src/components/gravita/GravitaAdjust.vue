<script setup lang="ts">
import { computed, ref, watch, Ref, nextTick} from 'vue'
import { Address, GravitaCollateralInfo, useCoreStore } from '../../store/core'
import { useActionStore } from '../../store/action'
import { standardiseDecimals, convertFromDecimals } from '../../utils/bn'
import { watchPausable } from '@vueuse/core'

const core = useCoreStore()
const actionStore = useActionStore()

const activeCollaterals = computed(() => core.gravitaCollateralInfo?.filter(x => x.isActive && core.getAggregatedActiveVessels.find(y => y.address === x.address && y.hasVessel)) || [])

const selectedCollateral: Ref<GravitaCollateralInfo | null> = ref(null)
const collateralAmount = ref(0)
const debtAmount = ref(0)
const debtRange = ref(0)
const loading = ref(false)

const availableDebt = computed(() => {
    if (!selectedCollateral.value) return 0
    return standardiseDecimals(Number(selectedCollateral.value.mintCap) - Number(selectedCollateral.value.totalAssetDebt), selectedCollateral.value.decimals)
})

const collateralValue = computed(() => {
    if (!selectedCollateral.value) return 0
    if (selectedCollateral.value.isPriceEthIndexed) {
        const ethCollateral = activeCollaterals.value.find(x => x.symbol === 'WETH');
        if (!ethCollateral) return 0
        return Number(collateralAmount.value) * standardiseDecimals(selectedCollateral.value.price, selectedCollateral.value.priceDecimals) * standardiseDecimals(ethCollateral.price, ethCollateral.priceDecimals)
    }
    return Number(collateralAmount.value) * standardiseDecimals(selectedCollateral.value.price, selectedCollateral.value.priceDecimals)
})

const collateralRatio = computed(() => {
    if (!selectedCollateral.value) return 0
    return collateralValue.value / Number(debtAmount.value) * 100
})

const loanToValue = computed(() => {
    if (!selectedCollateral.value) return 0
    return Number(debtAmount.value) / collateralValue.value * 100
})

const { pause: pauseDebtAmount, resume: resumeDebtAmount } = watchPausable(debtAmount, async () => {
    if (!selectedCollateral.value) return
    pauseDebtRange()
    debtRange.value = Number(debtAmount.value) / collateralValue.value * 100
    await nextTick()
    resumeDebtRange()
})

const { pause: pauseDebtRange, resume: resumeDebtRange } = watchPausable(debtRange, async () => {
    if (!selectedCollateral.value) return
    pauseDebtAmount()
    debtAmount.value = Math.floor(Number(debtRange.value) * collateralValue.value / 100)
    await nextTick()
    resumeDebtAmount()
})

const error = computed(() => {
    if (activeCollaterals.value.length === 0) return 'No active collaterals (you need an open vessel)'
    if (!selectedCollateral.value) return null
    if (collateralRatio.value < standardiseDecimals(selectedCollateral.value.minCollateralRatio, 16)) return `Loan to value too high (<${(1 / standardiseDecimals(selectedCollateral.value.minCollateralRatio, 20)).toFixed(0)}%)`
    if (debtAmount.value < standardiseDecimals(selectedCollateral.value.minNetDebt, selectedCollateral.value.decimals)) return `Debt amount too low (>${standardiseDecimals(selectedCollateral.value.minNetDebt, selectedCollateral.value.decimals)} GRAI)`
    if (debtAmount.value > availableDebt.value) return `Debt amount too high (<${availableDebt.value.toFixed(0)} GRAI)`
    return null
})

watch(collateralAmount, () => {
    if (!selectedCollateral.value) return
    debtRange.value = Number(debtAmount.value) / collateralValue.value * 100
})

watch(activeCollaterals, () => {
    selectedCollateral.value = activeCollaterals.value[0]
})

const addAction = async () => {
    if (!selectedCollateral.value) return
    loading.value = true
    try {
        const coll = convertFromDecimals(collateralAmount.value, selectedCollateral.value.decimals)
        const debt = convertFromDecimals(debtAmount.value, 18)

        const { upperHint, lowerHint } = await core.calculateGravitaHints(selectedCollateral.value.address, coll, debt)
        actionStore.spliceAction({
            name: 'GravitaAdjust',
            displayName: 'Adjust Vessel',
            calldata: [selectedCollateral.value.address, coll, debt, upperHint, lowerHint],
            balanceChanges: [{
                symbol: selectedCollateral.value.symbol,
                address: selectedCollateral.value.address,
                amount: collateralAmount.value * -1,
            }, {
                symbol: 'GRAI',
                address: core.getAddress(Address.gravitaDebtToken) as string,
                amount: debtAmount.value,
            }],
        }, actionStore.getActions.length)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="card w-[500px] bg-base-200 shadow-xl mx-auto">
        <div class="card-body">
            <h2 class="card-title">Adjust Vessel</h2>
            <div class="join">
                <input class="input input-bordered join-item w-full" v-model="collateralAmount"/>
                <select class="select select-bordered join-item" v-model="selectedCollateral">
                    <option v-for="collateral in activeCollaterals" :key="collateral.address" :value="collateral">
                        {{ collateral.symbol }}
                    </option>
                </select>
            </div>
            <label class="label">
                <span class="label-text-alt"></span>
                <span class="label-text-alt cursor-pointer" @click="collateralAmount = standardiseDecimals(selectedCollateral?.balanceOf, selectedCollateral?.decimals || 18)">Available: {{ standardiseDecimals(selectedCollateral?.balanceOf, selectedCollateral?.decimals || 18).toFixed(2) }} {{ selectedCollateral?.symbol }}</span>
            </label>
            <div class="join">
                <input class="input input-bordered join-item w-full" :class="{'input-error': error}" v-model="debtAmount"/>
                <input class="input input-bordered join-item w-[80px]" disabled value="GRAI" />
            </div>
            <input type="range" min="0" max="100" class="range range-primary range-sm" v-model="debtRange" />
            <label class="label error">
                <span class="label-text-alt"></span>
                <span class="label-text-alt text-error">{{ error }}</span>
            </label>
            <div v-if="debtAmount > 0">
                {{ collateralRatio.toFixed(0) }}% CR /
                {{ loanToValue.toFixed(0) }}% LTV
            </div>
            <div class="card-actions justify-end">
                <button class="btn btn-primary" :disabled="error !== null || loading" @click="addAction">Add Action <span v-if="loading" class="loading loading-spinner"></span></button>
            </div>
        </div>
    </div>
</template>