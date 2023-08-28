<script setup lang="ts">
import { computed, watch, ref, Ref, onMounted } from 'vue'
import { useActionStore } from '../../store/action'
import { useCoreStore } from '../../store/core'
import { standardiseDecimals } from '../../utils/bn';

const actions = useActionStore()
const core = useCoreStore()
const balances: Ref<any[]> = ref([])
const loading = ref(false)

const calculateBalances = async () => {
    if (missingBalances.value?.length > 0) {
        loading.value = true
        try {
            const newBalances = await core.getBalances(missingBalances.value.map(b => b.address))
            const balanceMap = []
            let i = 0
            let j = 0
            for (i; i < missingBalances.value.length; i++) {
                balanceMap.push({
                    symbol: missingBalances.value[i].symbol,
                    amount: standardiseDecimals(newBalances[j], newBalances[j + 1])
                })
                j += 2
            }
            balances.value = balanceMap
        } catch (e) {
            console.error(e)
        } finally {
            loading.value = false
        }
    }
}

watch(() => actions.actions.length, calculateBalances)

const missingBalances = computed(() => {    
    return actions.missingBalances.map(x => {
        const balance = balances.value.find(b => b.symbol === x.symbol)
        return {
            symbol: x.symbol,
            address: x.address,
            amount: (balance?.amount ?? 0) + x.amount
        }
    })
})

onMounted(calculateBalances)
</script>

<template>
    <div v-if="actions.actions.length > 0" class="p-4 my-4 w-100">
        <h2 class="font-bold">Actions Queue</h2>        
        <div class="overflow-x-auto action-bar">
            <div class="flex flex-row gap-4">
                <div v-for="(action, i) in actions.actions" :key="i" class="card bg-base-200 shadow-xl flex-none w-80 my-4">
                    <div class="card-body">
                        <h2 class="card-title flex justify-between">
                            <span>{{ action.displayName }}</span>
                            <button class="btn btn-square btn-sm" @click="actions.removeAction(i)">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </h2>
                        <div v-for="(balanceChange, j) in action.balanceChanges" :key="j" class="flex justify-between">
                            <span class="text-xs">{{ balanceChange.symbol }}</span>
                            <span class="text-xs" :class="{'text-red-500': balanceChange.amount < 0, 'text-green-500': balanceChange.amount > 0}">{{ balanceChange.amount }}</span>
                        </div>
                    </div> 
                </div>
            </div>
        </div>
        <div v-if="!loading && missingBalances.length > 0" class="my-4 alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <h4 class="text-sm">Some balances are missing:</h4>
            <div class="flex flex-col">
                <div v-for="balance in missingBalances" :key="balance.symbol" class="text-right">
                    <span class="text-xs">{{ balance.symbol }} {{ (balance.amount * -1).toFixed(3) }}</span>
                </div>
            </div>
        </div>
        <div v-else-if="loading" class="my-4">
            <span class="text-xs">Calculating... <span class="loading loading-spinner"></span></span>
        </div>
    </div>
</template>

<style scoped>
.action-bar {
    max-width: calc(100vw - 286px);
}

@media (max-width: 768px) {
    .action-bar {
        max-width: calc(100vw - 32px);
    }
}
</style>