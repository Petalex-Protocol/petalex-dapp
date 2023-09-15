<script setup lang="ts">
import { computed, ref } from 'vue'
import { Location, useActionStore } from '../../store/action'
import { useCoreStore } from '../../store/core'
import { standardiseDecimals } from '../../utils/bn';

const actions = useActionStore()
const core = useCoreStore()
const loading = ref(false)

const missingBalancesWallet = computed(() => {   
    return actions.getBalances.filter(x => x.amount < 0 && x.location === Location.wallet).map(x => {
        const token = core.availableTokens.find(b => b.symbol === x.symbol)
        return {
            symbol: x.symbol,
            address: x.address,
            amount: standardiseDecimals(token?.balanceOf ?? 0, token?.decimals ?? 18) + x.amount
        }
    }).filter(x => x.amount < 0)
})

const missingBalancesProxy = computed(() => {   
    return actions.getBalances.filter(x => x.amount < 0 && x.location === Location.proxy).map(x => {
        const token = core.availableTokens.find(b => b.symbol === x.symbol)
        return {
            symbol: x.symbol,
            address: x.address,
            amount: standardiseDecimals(token?.balanceOfProxy ?? 0, token?.decimals ?? 18) + x.amount
        }
    }).filter(x => x.amount < 0)
})
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
        <div v-if="!loading && missingBalancesWallet.length > 0" class="my-4 alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <h4 class="text-sm">Your address is missing the following balances:</h4>
            <div class="flex flex-col">
                <div v-for="balance in missingBalancesWallet" :key="balance.symbol" class="text-right">
                    <span class="text-xs">{{ balance.symbol }} {{ (balance.amount * -1).toFixed(3) }}</span>
                </div>
            </div>
        </div>
        <div v-if="!loading && missingBalancesProxy.length > 0" class="my-4 alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <h4 class="text-sm">The proxy address is missing the following balances:</h4>
            <div class="flex flex-col">
                <div v-for="balance in missingBalancesProxy" :key="balance.symbol" class="text-right">
                    <span class="text-xs">{{ balance.symbol }} {{ (balance.amount * -1).toFixed(3) }}</span>
                </div>
            </div>
        </div>
        <div v-if="loading" class="my-4">
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