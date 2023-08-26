<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCoreStore, Address } from '../../store/core'
import NetworkUnsupported from '../common/NetworkUnsupported.vue'
import { chain, account } from '@kolirt/vue-web3-auth'
import { standardiseDecimals } from '../../utils/bn'

const core = useCoreStore()
const adminAddress = computed(() => core.getAddress(Address.gravitaAdmin))

const activeCollaterals = computed(() => core.gravitaCollateralInfo?.filter(x => x.isActive) || [])
const loading = ref(false)

const init = async () => {
    if (!loading.value) {
        try {
            if (account.connected) {
                loading.value = true
                await core.getGravitaCollateralInfo()
            }
        } catch (error) {
            console.log(error)
        } finally {
            loading.value = false
        }
    }
}

watch([chain, account], init)

onMounted(init)
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
                <tbody v-if="!loading">
                    <tr v-for="collateral in activeCollaterals" :key="collateral.address">
                        <td class="flex items-center justify-between">
                            <span>{{ collateral.name }}</span>                    
                            <span v-if="!collateral.priceFeed" class="text-error flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mx-1">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg> No price feed
                            </span>
                        </td>
                        <td>{{ standardiseDecimals(collateral.minNetDebt, collateral.decimals).toFixed(0) }}</td>
                        <td>{{ standardiseDecimals(Number(collateral.mintCap) - Number(collateral.totalAssetDebt), collateral.decimals).toFixed(0) }}</td>
                    </tr>
                </tbody>
                <tbody v-else>
                    <tr>
                        <td colspan="3" class="text-center"><span class="loading loading-spinner text-primary loading-md"></span></td>
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