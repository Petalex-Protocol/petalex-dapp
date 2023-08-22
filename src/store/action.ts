import { defineStore } from "pinia"

export interface Action {
    name: string
    calldata: any[]
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
