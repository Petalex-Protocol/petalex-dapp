<script setup lang="ts">
import { computed, ref } from 'vue'
import { Action, BalanceChange, Location, useActionStore } from '../../store/action'
import { useCoreStore } from '../../store/core'
import { standardiseDecimals } from '../../utils/bn'
import { useAppStore } from '../../store/app'
import { MaxUint256 } from 'ethers'

const actions = useActionStore()
const core = useCoreStore()
const loading = ref(false)
const app = useAppStore()

const actionMissingBalance = (action: Action, index: number) => {
    let i = 0

    // Only track changes between actions, so iterate through previous actions and record lowest balances
    const trackedTokens = core.availableTokens.map(x => ({ lowestBalanceOf: BigInt(0), lowestBalanceOfProxy: BigInt(0), ...x}))
    while (i < index) {
        const balanceChanges = actions.actions[i].balanceChanges
        for (const balance of balanceChanges) {
            const token = trackedTokens.find(b => b.address === balance.address)
            if (token) {
                if (balance.location === Location.proxy) {
                    token.balanceOfProxy = (BigInt(token.balanceOfProxy ?? 0) + balance.amount).toString()
                    if (token.lowestBalanceOfProxy > BigInt(token.balanceOfProxy)) token.lowestBalanceOfProxy = BigInt(token.balanceOfProxy)
                } else {
                    token.balanceOf = (BigInt(token.balanceOf ?? 0) + balance.amount).toString()
                    if (token.lowestBalanceOf > BigInt(token.balanceOf)) token.lowestBalanceOf = BigInt(token.balanceOf)
                }
            }
        }
        i++
    }

    // For current action, check if any balances are lower than the lowest recorded balance and that need to be shown to the user
    const missingBalancesForAction = []
    for (const balance of action.balanceChanges) {
        const token = trackedTokens.find(b => b.address === balance.address)
        if (token) {
            const tokenBalance = BigInt((balance.location === Location.proxy ? token.balanceOfProxy : token.balanceOf) ?? 0)
            const lowestTokenBalance = BigInt((balance.location === Location.proxy ? token.lowestBalanceOfProxy : token.lowestBalanceOf) ?? 0)
            const newBalance = tokenBalance + balance.amount
            if (newBalance < 0 && newBalance < lowestTokenBalance) {
                missingBalancesForAction.push({
                    symbol: balance.symbol,
                    address: balance.address,
                    decimals: balance.decimals,
                    amount: balance.amount,
                    location: balance.location,
                } as BalanceChange)
            }
        }
    }

    return missingBalancesForAction
}

const error = computed(() => {
    if (actions.actions.length === 0) return 'Must add at least one action'
    if (!actions.canExecute) return 'No valid actions to execute'
    let i = 0
    for (const action of actions.actions) {
        if (actionMissingBalance(action, i).length > 0) return 'Cannot execute actions due to insufficient balance(s)'
        ++i
    }
    return null
})

const executeAction = async () => {
    let id = -1
    loading.value = true
    try {
        const data = await actions.executeActions()
        id = app.addToast('Executing actions...', 'alert-info', 0)
        await data?.wait()
    } catch (error) {  
        app.addToast('Error executing actions', 'alert-error', 5000)      
        console.log(error)
    } finally {
        app.removeToast(id)
        loading.value = false
    }  
}

const approve = async () => {
    let id = -1
    loading.value = true
    try {
        const nextToken = actions.nextToken
        if (nextToken) {
            const data = await actions.approveNextToken()
            id = app.addToast('Approving token...', 'alert-info', 0)
            await data?.wait()
            core.setTokenAllowance(nextToken.address, BigInt(MaxUint256))
        }
    } catch (error) {  
        app.addToast('Error approving token', 'alert-error', 5000)      
        console.log(error)
    } finally {
        app.removeToast(id)
        loading.value = false
    }  
}

const formatWarning = (missingBalances: BalanceChange[]) => {
    // N.B. \r\n doesn't work in tooltips
    let text = ''
    if (missingBalances.filter(x => x.location === Location.wallet).length > 0) {
        text = 'Your address is missing the following balances:\r\n'
        for (const balance of missingBalances.filter(x => x.location === Location.wallet)) {
            text += `${standardiseDecimals(balance.amount * BigInt(-1), balance.decimals)} ${balance.symbol}`
        }
    }

    if (missingBalances.filter(x => x.location === Location.proxy).length > 0) {
        text = 'Your proxy wallet is missing the following balances:\r\n'
        for (const balance of missingBalances.filter(x => x.location === Location.proxy)) {
            text += `${standardiseDecimals(balance.amount * BigInt(-1), balance.decimals)} ${balance.symbol}`
        }
    }
    return text
}
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
                            <span class="text-xs text-white">{{ balanceChange.symbol }} {{ balanceChange.location === Location.wallet ? '(wallet)' : '' }}</span>
                            <span class="text-xs" :class="{'text-red-500': balanceChange.amount < 0, 'text-green-500': balanceChange.amount > 0}">{{ standardiseDecimals(balanceChange.amount, balanceChange.decimals).toString().indexOf('.') > -1 ? standardiseDecimals(balanceChange.amount, balanceChange.decimals).toFixed(3) : standardiseDecimals(balanceChange.amount, balanceChange.decimals) }}</span>
                        </div>
                        <div v-if="actionMissingBalance(action, i).length > 0" class="tooltip flex justify-between text-white" :data-tip="formatWarning(actionMissingBalance(action, i))">
                            <span></span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                    </div> 
                </div>
            </div>
        </div>
        <div v-if="!error" class="my-4">
            <button v-if="actions.needsApproval" type="button" class="btn btn-primary" :disabled="loading" @click="approve()">Approve <span v-if="loading" class="loading loading-spinner"></span></button>
            <button v-if="!actions.needsApproval" type="button" class="btn btn-primary" :disabled="loading" @click="executeAction()">Execute Actions <span v-if="loading" class="loading loading-spinner"></span></button>
        </div>
    </div>
</template>

<style scoped>
.action-bar {
    max-width: calc(100vw - 366px);
}

@media (max-width: 768px) {
    .action-bar {
        max-width: calc(100vw - 32px);
    }
}
</style>