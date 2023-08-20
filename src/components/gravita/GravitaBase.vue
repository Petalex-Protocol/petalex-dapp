<script setup lang="ts">
import { computed, watch } from 'vue'
import { useCoreStore, Address } from '../../store/core'
import NetworkUnsupported from '../common/NetworkUnsupported.vue'
import { chain } from '@kolirt/vue-web3-auth'
import { standardiseDecimals } from '../../utils/bn'

const core = useCoreStore()
const adminAddress = computed(() => core.getAddress(Address.gravitaAdmin))

const activeCollaterals = computed(() => core.gravitaCollateralInfo?.filter(x => x.isActive) || [])

watch(chain, async () => {
    try {
        await core.getCollateralInfo()
    } catch (error) {
        console.log(error)
    }
})
</script>

<template>
    <div v-if="adminAddress">
        <div class="overflow-x-auto">
            <table class="table">
                <thead>
                    <tr>
                        <th>Collateral</th>
                        <th>Minimum Debt</th>
                        <th>Available Debt</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="collateral in activeCollaterals" :key="collateral.address">
                        <td>{{ collateral.name }}</td>
                        <td>{{ standardiseDecimals(collateral.minNetDebt, collateral.decimals).toFixed(0) }}</td>
                        <td>{{ standardiseDecimals(Number(collateral.mintCap) - Number(collateral.totalAssetDebt), collateral.decimals).toFixed(0) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <RouterView class="my-4" />
    </div>
    <div v-else>
        <NetworkUnsupported />
    </div>
</template>