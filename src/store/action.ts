import { defineStore } from "pinia"

export interface BalanceChange {
    symbol: string
    address: string
    amount: number
}

export interface Action {
    name: string
    displayName: string
    calldata: any[]
    balanceChanges: BalanceChange[]
}

export interface ActionState {
    actions: Action[]
}

export const useActionStore = defineStore({
    id: "actions",
    state: () =>
        ({
            actions: [],
        } as ActionState),
    getters: {
        getActions(state: ActionState) {
            return state.actions
        },
        getBalances(state: ActionState): BalanceChange[] {
            const balances: BalanceChange[] = []
            for (const action of state.actions) {
                for (const balanceChange of action.balanceChanges) {
                    const index = balances.findIndex((b) => b.symbol === balanceChange.symbol)
                    if (index === -1) {
                        balances.push({
                            ...balanceChange // copy to not affect calculations
                        })
                    } else {
                        balances[index].amount += balanceChange.amount
                    }
                }
            }
            return balances
        },
    },
    actions: {
        spliceAction(action: Action, index: number) {
            this.actions.splice(index, 0, action)
        },
        removeAction(index: number) {
            this.actions.splice(index, 1)
        },
    },
})
