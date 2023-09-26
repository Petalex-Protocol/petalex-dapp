import { defineStore } from "pinia"
import { Address, NATIVE_ADDRESS, useCoreStore } from "./core"
import { account, writeContract } from '@kolirt/vue-web3-auth'
import actionExecutorAbi from '../abi/petalex/actionexecutor.json'
import erc20Abi from '../abi/petalex/erc20.json'
import { MaxUint256, AbiCoder } from "ethers"

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
    calldata: string
    value?: bigint
    balanceChanges: BalanceChange[],
    removeAction?: () => void,
    data: any[],
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
        needsApproval(state: ActionState) {
            const core = useCoreStore()
            if (!account.connected || core.selectedToken === -1) {
                return false
            }

            const pullActions = state.actions.filter(x => x.type === ActionType.Pull && x.data[0] !== NATIVE_ADDRESS).map(x => ({ address: x.data[0], amount: x.data[1] as bigint }))
            const tokens = core.availableTokens.filter(x => pullActions.some(y => y.address === x.address && x.allowance < y.amount))

            if (tokens.length === 0) {
                return false
            }
            return true
        },
        nextToken(state: ActionState) {
            const core = useCoreStore()
            if (!account.connected || core.selectedToken === -1) {
                return null
            }

            const pullActions = state.actions.filter(x => x.type === ActionType.Pull && x.data[0] !== NATIVE_ADDRESS).map(x => ({ address: x.data[0], amount: x.data[1] as bigint }))
            const tokens = core.availableTokens.filter(x => pullActions.some(y => y.address === x.address && x.allowance < y.amount))

            if (tokens.length === 0) {
                return null
            }
            return tokens[0]
        },
        canExecute(state: ActionState) {
            let actions = [...state.actions]
            actions = actions.filter(x => !((x.type === ActionType.Pull && x.data[0] === NATIVE_ADDRESS) || x.type === ActionType.FlashReturn)) // native tokens get send in value param
            return actions.length > 0
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
        async executeActions() {
            const core = useCoreStore()
            const actionExecutor = core.getAddress(Address.actionExecutor)
            const flashLoanAddress = core.getAddress(Address.flashLoanAction)
            if (!actionExecutor || !flashLoanAddress || !account.connected || core.selectedToken === -1) {
                return
            }

            const value = this.actions.filter(x => x.value).reduce((a, b) => a + b.value!, BigInt(0))

            // HANDLE SPECIAL CASES
            
            // copy this.actions so we can manipulate it without changing original state
            let actions = [...this.actions]
            actions = actions.filter(x => !((x.type === ActionType.Pull && x.data[0] === NATIVE_ADDRESS) || x.type === ActionType.FlashReturn)) // native tokens get send in value param

            // flash return action needs to be changed to a send action that sends the flashed amount + fee to the flash action address
            // if we flashed both tokens, we need to send both tokens + fee
            const flashReturn = this.actions.find(x => x.type === ActionType.FlashReturn)
            if (flashReturn && flashReturn.data) {
                if (flashReturn.data[1] as bigint > BigInt(0)) {
                    actions.push({
                        type: ActionType.Send,
                        displayName: 'Send',
                        // token, to address, amount
                        calldata: AbiCoder.defaultAbiCoder().encode(['address', 'address', 'uint256'], [flashReturn.data[3], flashLoanAddress, flashReturn.data[1]]),
                        data: [],
                        balanceChanges: [],
                    } as Action)
                }
                if (flashReturn.data[2] as bigint > BigInt(0)) {
                    actions.push({
                        type: ActionType.Send,
                        displayName: 'Send',
                        // token, to address, amount
                        calldata: AbiCoder.defaultAbiCoder().encode(['address', 'address', 'uint256'], [flashReturn.data[4], flashLoanAddress, flashReturn.data[2]]),
                        data: [],
                        balanceChanges: [],
                    } as Action)
                }
            }

            // END HANDLE SPECIAL CASES

            return await writeContract({
                address: actionExecutor as `0x${string}`,
                abi: actionExecutorAbi,
                functionName: 'executeActionList',
                args: [{ callData: actions.map(x => x.calldata), actionIds: actions.map(x => this.actionMap[x.type]), tokenId: core.selectedToken }],
                value,
            })
        },
        async approveNextToken() {
            const core = useCoreStore()
            if (!account.connected || core.selectedToken === -1) {
                return
            }

            const pullActions = this.actions.filter(x => x.type === ActionType.Pull && x.data[0] !== NATIVE_ADDRESS).map(x => ({ address: x.data[0], amount: x.data[1] as bigint }))
            const tokens = core.availableTokens.filter(x => pullActions.some(y => y.address === x.address && x.allowance < y.amount))

            if (tokens.length === 0) {
                return
            }

            const nextToken = tokens[0]

            return await writeContract({
                address: nextToken.address as `0x${string}`,
                abi: erc20Abi,
                functionName: 'approve',
                args: [core.selectedProxyAddress, MaxUint256],
            })
        },
        disconnect() {
            this.actions = []
        },
    },
})