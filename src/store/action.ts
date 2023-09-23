import { defineStore } from "pinia"

export enum Location {
    proxy,
    wallet,
}

export enum ActionType {
    GravitaOpen,
    GravitaClose,
    GravitaAdjust,
    LiquityOpen,
    LiquityClose,
    LiquityAdjust,
    UniswapV3ExactInput,
    Flash,
    FlashReturn,
    Pull,
    Send,
    Wrap,
    Unwrap,
}

export interface BalanceChange {
    symbol: string
    address: string
    decimals: number
    amount: bigint
    location: Location
}

export interface Action {
    type: ActionType
    displayName: string
    calldata: any[]
    value?: bigint
    balanceChanges: BalanceChange[],
    removeAction?: () => void,
    data?: any[],
}

export interface ActionState {
    actions: Action[]
    actionMap: { [key: string]: number } // obtained from petalex deployment script
}

export const useActionStore = defineStore({
    id: "actions",
    state: () =>
        ({
            actions: [],
            actionMap: {
                [ActionType.GravitaOpen]: 5,
                [ActionType.GravitaClose]: 7,
                [ActionType.GravitaAdjust]: 6,

                [ActionType.LiquityOpen]: 9,
                [ActionType.LiquityClose]: 11,
                [ActionType.LiquityAdjust]: 10,

                [ActionType.UniswapV3ExactInput]: 4,

                [ActionType.Flash]: 2,
                [ActionType.FlashReturn]: 2,

                [ActionType.Pull]: 3,
                [ActionType.Send]: 1,
                [ActionType.Wrap]: 14,
                [ActionType.Unwrap]: 15,
            }
        } as ActionState),
    getters: {
        getActions(state: ActionState) {
            return state.actions
        },
    },
    actions: {
        spliceAction(action: Action, index: number) {
            const l = this.actions.length
            if (l > 0 && index === l && this.actions[index - 1].type === ActionType.FlashReturn) {
                index -= 1
            }
            this.actions.splice(index, 0, action)
        },
        removeAction(index: number) {
            const removeAction = this.actions[index].removeAction

            if (this.actions[index].type === ActionType.Flash) {
                const returnIndex = this.actions.findIndex(x => x.type === ActionType.FlashReturn)
                this.actions.splice(returnIndex, 1)
            }
            if (this.actions[index].type === ActionType.FlashReturn) {
                this.actions.splice(0, 1)
                index -= 1
            }
            this.actions.splice(index, 1)

            if (removeAction) {
                (removeAction as () => void)()
            }
        },
        disconnect() {
            this.actions = []
        },
    },
})
