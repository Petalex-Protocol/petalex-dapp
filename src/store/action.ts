import { defineStore } from "pinia"

export enum Location {
    proxy,
    wallet,
}

export interface BalanceChange {
    symbol: string
    address: string
    amount: number
    location: Location
}

export interface Action {
    name: string
    displayName: string
    calldata: any[]
    value?: bigint
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
                    const index = balances.findIndex((b) => b.symbol === balanceChange.symbol && b.location === balanceChange.location)
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
            const l = this.actions.length
            if (l > 0 && index === l && this.actions[index - 1].name === 'FlashReturn') {
                index -= 1
            }
            this.actions.splice(index, 0, action)
        },
        removeAction(index: number) {
            if (this.actions[index].name === 'Flash') {
                const returnIndex = this.actions.findIndex(x => x.name === 'FlashReturn')
                this.actions.splice(returnIndex, 1)
            }
            if (this.actions[index].name === 'FlashReturn') {
                this.actions.splice(0, 1)
                index -= 1
            }
            this.actions.splice(index, 1)
            
        },
    },
})
