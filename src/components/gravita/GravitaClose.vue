<script setup lang="ts">
import { computed, ref, watch, Ref} from 'vue'
import { Address, useCoreStore } from '../../store/core'
import { Location, useActionStore } from '../../store/action'
import { useGravitaStore, GravitaCollateralInfo } from '../../store/gravita'

const core = useCoreStore()
const actionStore = useActionStore()
const gravita = useGravitaStore()

const activeCollaterals = computed(() => gravita.gravitaCollateralInfo?.filter(x => x.isActive && gravita.getAggregatedActiveVessels.find(y => y.address === x.address && y.hasVessel)) || [])

const selectedCollateral: Ref<GravitaCollateralInfo | null> = ref(null)
const loading = ref(false)

const error = computed(() => {
    if (activeCollaterals.value.length === 0) return 'No active collaterals (you need an open vessel)'
    if (!selectedCollateral.value) return null
    return null
})

watch(activeCollaterals, () => {
    selectedCollateral.value = activeCollaterals.value[0]
})

const addAction = async () => {
    if (!selectedCollateral.value) return
    loading.value = true
    try {
        actionStore.spliceAction({
            name: 'GravitaClose',
            displayName: 'Close Vessel',
            // collateral
            calldata: [selectedCollateral.value.address],
            balanceChanges: [{
                symbol: selectedCollateral.value.symbol,
                address: selectedCollateral.value.address,
                decimals: selectedCollateral.value.decimals,
                amount: BigInt(selectedCollateral.value.vesselCollateral),
                location: Location.proxy,
            }, {
                symbol: 'GRAI',
                address: core.getAddress(Address.gravitaDebtToken) as string,
                amount: BigInt(selectedCollateral.value.vesselDebt) * BigInt(-1),
                decimals: 18,
                location: Location.proxy,
            }],
            removeAction: () => {
                gravita.recalculateActiveVessels()
            },
        }, actionStore.getActions.length)

        // update store to reflect changes
        gravita.closeVessel(selectedCollateral.value.address)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="card w-[500px] bg-base-200 shadow-xl mx-auto">
        <div class="card-body">
            <h2 class="card-title">Close Vessel</h2>
            <div class="join justify-end">
                <select class="select select-bordered join-item" v-model="selectedCollateral">
                    <option v-for="collateral in activeCollaterals" :key="collateral.address" :value="collateral">
                        {{ collateral.symbol }}
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