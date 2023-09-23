import { defineStore } from "pinia"
import { erc20ABI, multicall, account, readContract } from '@kolirt/vue-web3-auth'
import adminAbi from '../abi/gravita/admin.json'
import priceFeedAbi from '../abi/gravita/pricefeed.json'
import vesselManagerOperationsAbi from '../abi/gravita/vesselmanageroperations.json'
import vesselManagerAbi from '../abi/gravita/vesselmanager.json'
import sortedVesselsAbi from '../abi/gravita/sortedvessels.json'
import oracleAbi from '../abi/gravita/oracle.json'

import { ActionType, useActionStore } from "./action"
import { useCoreStore, Token, Address } from "./core"
import { getRandomInt } from "../utils/math"
import { convertFromDecimals, standardiseDecimals } from "../utils/bn"

export interface GravitaCollateralInfo extends Token {
    mintCap: string
    minNetDebt: string
    totalAssetDebt: string
    balanceOf: string
    isActive: boolean
    minCollateralRatio: string
    recoveryCollateralRadio: string
    priceFeed: string
    priceDecimals: string
    isPriceEthIndexed: boolean

    vesselStatus: number
    vesselCollateral: string
    vesselDebt: string
    restoreData?: any[]
}

export interface GravitaState {
    gravitaCollateralInfo: GravitaCollateralInfo[]
}

export const useGravitaStore = defineStore({
    id: "gravita",
    state: () => 
        ({
            gravitaCollateralInfo: [],
        }) as GravitaState,
    getters: {
        getAggregatedActiveVessels: (state: GravitaState) => {
            const actionStore = useActionStore()
            const openedVessels = actionStore.actions?.filter(x => x.type === ActionType.GravitaOpen) || []
            return [
                ...openedVessels.map(x => ({
                    address: x.calldata[0],
                    hasVessel: true
                })),
                ...state.gravitaCollateralInfo.map(x => ({ address: x.address, hasVessel: x.vesselStatus === 1 }))
            ]
        },
    },
    actions: {
        async getGravitaCollateralInfo() {
            const core = useCoreStore()
            this.gravitaCollateralInfo = []
            const address = core.getAddress(Address.gravitaAdmin)
            const vesselManagerAddress = core.getAddress(Address.gravitaVesselManager)
            if (!address || !vesselManagerAddress || !account.connected) {
                return
            }

            // First get all valid collaterals for querying and price feed address
            let collaterals: string[] = []
            let priceFeed: string = ''

            const initResult = await multicall({
                calls: [
                    {
                        abi: adminAbi,
                        contractAddress: address as `0x${string}`,
                        calls: [                            
                            ['getValidCollateral', []],
                            ['priceFeed', []],
                        ],
                    },
                ]
            })
            let i = 0
            for (const r of initResult) {
                const data = r as any
                if (data.status === 'success') {
                    if (i === 0) {
                        collaterals = data.result
                    } else {
                        priceFeed = data.result
                    }
                } else {
                    throw new Error(`Error getting init info: ${data}`)
                }
                ++i
            }

            // Use multicall3 to group the info into as few rpc calls as possible
            const calls: [string, Array<any>?][] = []
            const collateralCalls: any[] = []
            const priceFeedCalls: any[] = []
            const infos: GravitaCollateralInfo[] = []
            const vesselStatusCalls: any[] = []
            for (const collateral of collaterals) {
                calls.push(['getMintCap', [collateral]])
                calls.push(['getMinNetDebt', [collateral]])
                calls.push(['getTotalAssetDebt', [collateral]])
                calls.push(['getIsActive', [collateral]])
                calls.push(['getMcr', [collateral]])
                calls.push(['getCcr', [collateral]])
                infos.push({
                    mintCap: '0',
                    minNetDebt: '0',
                    totalAssetDebt: '0',
                    address: collateral,
                    name: '',
                    decimals: 18,
                    balanceOf: '0',
                    balanceOfProxy: '0',
                    symbol: '',
                    isActive: false,
                    minCollateralRatio: '0',
                    recoveryCollateralRadio: '0',
                    priceFeed: '',
                    price: '0',
                    priceDecimals: '8',
                    isPriceEthIndexed: false,
                    vesselStatus: 0,
                    vesselCollateral: '0',
                    vesselDebt: '0',
                })
                collateralCalls.push({
                    abi: erc20ABI,
                    contractAddress: collateral as `0x${string}`,
                    calls: [
                        ['name', []],
                        ['symbol', []],
                        ['decimals', []],
                        ['balanceOf', [account.address]],
                        ['balanceOf', [core.selectedProxyAddress]]
                    ],
                })
                priceFeedCalls.push({
                    abi: priceFeedAbi,
                    contractAddress: priceFeed as `0x${string}`,
                    calls: [
                        ['oracles', [collateral]],
                    ],
                })
                vesselStatusCalls.push({
                    abi: vesselManagerAbi,
                    contractAddress: vesselManagerAddress as `0x${string}`,
                    calls: [
                        ['getVesselColl', [collateral, core.selectedProxyAddress]],
                        ['getVesselDebt', [collateral, core.selectedProxyAddress]],
                        ['getVesselStatus', [collateral, core.selectedProxyAddress]],
                    ]
                })
            }

            const result = await multicall({
                calls: [
                    {
                        abi: adminAbi,
                        contractAddress: address as `0x${string}`,
                        calls,
                    },
                    ...collateralCalls,
                    ...priceFeedCalls,
                    ...vesselStatusCalls,
                ]
            })

            // Parse the results into the info objects
            i = 0
            let j = 1
            let k = 0
            let adminMod = 6 // number of admin contract calls
            let ercMod = 5 // number of erc20 calls
            let priceFeedMod = 1 // number of price feed calls
            let vesselManagerMod = 3 // number of vessel manager calls
            let adminCalls = true
            let processingCollateralCalls = false
            let processingPriceFeedCalls = false
            let processingVesselManagerCalls = false

            for (const r of result) {
                const data = r as any
                const info = infos[i]
                
                if (adminCalls) {
                    if (data.status === 'success') {
                        switch (j) {    
                            case 1:
                                info.mintCap = data.result.toString()
                                break
                            case 2:
                                info.minNetDebt = data.result.toString()
                                break
                            case 3:
                                info.totalAssetDebt = data.result.toString()
                                break
                            case 4:
                                info.isActive = data.result
                                break
                            case 5:
                                info.minCollateralRatio = data.result.toString()
                                break
                            case 6:
                                info.recoveryCollateralRadio = data.result.toString()
                                break
                        }
                    } else {
                        throw new Error(`Error getting admin info: ${data}`)
                    }
                } else if (processingCollateralCalls) {
                    if (data.status === 'success') {
                        switch (j) {
                            case 1:
                                info.name = data.result.toString()
                                break
                            case 2:
                                info.symbol = data.result.toString()
                                break
                            case 3:
                                info.decimals = data.result
                                break
                            case 4:
                                info.balanceOf = data.result.toString()
                                break
                            case 5:
                                info.balanceOfProxy = data.result.toString()
                                break
                        }
                    } else {
                        throw new Error(`Error getting collateral info: ${data}`)
                    }
                } else if (processingPriceFeedCalls) {
                    if (data.status === 'success') {
                        const oracleResult = data.result as Array<any>
                        // 0 = price feed address, 1 = provider type, 2 = timeout (seconds), 3 = decimals, 4 = is eth indexed
                        switch (j) {
                            case 1:
                                info.priceFeed = oracleResult[0].toString()
                                info.priceDecimals = oracleResult[3].toString()
                                info.isPriceEthIndexed = oracleResult[4]
                                break
                        }
                    } else {
                        // no price feed for this collateral so don't throw as it might just be inactive
                    }
                } else {
                    if (data.status === 'success') {
                        // 0 = collateral, 1 = debt, 2 = status
                        switch (j) {
                            case 1:
                                info.vesselCollateral = data.result.toString()
                                break
                            case 2:
                                info.vesselDebt = data.result.toString()
                                break
                            case 3:
                                info.vesselStatus = Number(data.result)
                                break
                        }
                    } else {
                        throw new Error(`Error getting vessel info: ${data}`)
                    }
                }
                if ((adminCalls && (j % adminMod === 0)) || (processingCollateralCalls && (j % ercMod === 0)) || (processingPriceFeedCalls && (j % priceFeedMod === 0)) || (processingVesselManagerCalls && (j % vesselManagerMod === 0))) {
                    ++i
                    j = 0
                }                
                ++k
                ++j
                if (k === calls.length) {
                    adminCalls = false
                    processingCollateralCalls = true
                    i = 0
                }
                if (k === calls.length + (collateralCalls.length * ercMod)) {
                    processingCollateralCalls = false
                    processingPriceFeedCalls = true
                    i = 0
                }
                if (k === calls.length + (collateralCalls.length * ercMod) + (priceFeedCalls.length * priceFeedMod)) {
                    processingPriceFeedCalls = false
                    processingVesselManagerCalls = true
                    i = 0
                }
            }

            // Get the price for each collateral
            const priceResult = await multicall({
                calls: infos.filter(x => x.priceFeed).map(x => ({
                        abi: oracleAbi,
                        contractAddress: x.priceFeed as `0x${string}`,
                        calls: [                            
                            ['latestRoundData', []],
                        ],
                    })
                )
            })
            i = 0
            for (const r of priceResult) {
                const data = r as any
                while (infos[i].priceFeed === '') {
                    ++i
                }
                const info = infos[i]
                if (data.status === 'success') {
                    const oracleResult = data.result as Array<any>
                    // 0 = roundId, 1 = answer, 2 = startedAt, 3 = updatedAt, 4 = answeredInRound
                    info.price = oracleResult[1].toString()
                } else {
                    // no price feed for this collateral so don't throw as it might just be inactive
                }
                ++i
            }

            for (const info of infos) {
                if (info.isPriceEthIndexed) {
                    const ethCollateral = infos.find(x => x.symbol === 'WETH');
                    if (ethCollateral) {
                        info.price = convertFromDecimals(standardiseDecimals(info.price, info.priceDecimals) * standardiseDecimals(ethCollateral.price, ethCollateral.priceDecimals), info.priceDecimals).toString()
                    }
                }

                info.restoreData = [info.vesselStatus, info.vesselCollateral, info.vesselDebt]
            }

            this.gravitaCollateralInfo = infos

            core.availableTokens.push(...this.gravitaCollateralInfo.filter(x => !core.availableTokens.find(a => a.address === x.address)))
        },
        async calculateGravitaHints(collateralAddress: string, coll: bigint, debt: bigint) {
            const core = useCoreStore()
            const sortedVesselsAddress = core.getAddress(Address.gravitaSortedVessels)
            const vesselManagerOperationsAddress = core.getAddress(Address.gravitaVesselManagerOperations)
            const result = await multicall({
                calls: [
                    {
                        abi: sortedVesselsAbi,
                        contractAddress: sortedVesselsAddress as `0x${string}`,
                        calls: [
                            ['getSize', [collateralAddress]],
                        ],
                    },
                    {
                        abi: vesselManagerOperationsAbi,
                        contractAddress: vesselManagerOperationsAddress as `0x${string}`,
                        calls: [
                            ['computeNominalCR', [coll, debt]],
                        ],
                    },
                ]
            })

            const sortedVesselsResult = result[0] as any
            const vesselManagerOperationsResult = result[1] as any
            if (sortedVesselsResult.status !== 'success' || vesselManagerOperationsResult.status !== 'success') {
                console.error(result)
                throw new Error(`Error getting sorted vessels info`)
            }

            const hintResult = await readContract({
                address: vesselManagerOperationsAddress as `0x${string}`,
                abi: vesselManagerOperationsAbi,
                functionName: 'getApproxHint',
                args: [collateralAddress, vesselManagerOperationsResult.result, sortedVesselsResult.result * BigInt(15), getRandomInt()],
            })

            const insertPositionResult = await readContract({
                address: sortedVesselsAddress as `0x${string}`,
                abi: sortedVesselsAbi,
                functionName: 'findInsertPosition',
                args: [collateralAddress, vesselManagerOperationsResult.result, hintResult[0], hintResult[0]],
            })

            return { upperHint: insertPositionResult[0], lowerHint: insertPositionResult[1] }
        },
        adjustVessel(collateralAddress: string, collateralAmount: string, debtAmount: string) {
            const collateral = this.gravitaCollateralInfo.find(x => x.address === collateralAddress)
            if (collateral) {
                collateral.vesselStatus = 1
                collateral.vesselCollateral = collateralAmount
                collateral.vesselDebt = debtAmount
            }
        },
        closeVessel(collateralAddress: string) {
            const collateral = this.gravitaCollateralInfo.find(x => x.address === collateralAddress)
            if (collateral) {
                collateral.vesselStatus = 0
                collateral.vesselCollateral = '0'
                collateral.vesselDebt = '0'
            }
        },
        recalculateActiveVessels() {
            const actionStore = useActionStore()

            for (const collateral of this.gravitaCollateralInfo) {
                collateral.vesselStatus = Number(collateral.restoreData?[0] : 0)
                collateral.vesselCollateral = (collateral.restoreData?[1] : '0').toString()
                collateral.vesselDebt = (collateral.restoreData?[2] : '0').toString()
            }

            const openedVessels = actionStore.actions?.filter(x => x.type === ActionType.GravitaOpen) || []
            for (const vessel of openedVessels) {
                if (vessel.data) {
                    const collateralAddress = vessel.data[0]
                    const collateralAmount = vessel.data[1]
                    const debtAmount = vessel.data[2]
                    this.adjustVessel(collateralAddress, collateralAmount, debtAmount)
                }                
            }

            const adjustedVessels = actionStore.actions?.filter(x => x.type === ActionType.GravitaAdjust) || []
            for (const vessel of adjustedVessels) {
                if (vessel.data) {
                    const collateralAddress = vessel.data[0]
                    const collateralAmount = vessel.data[1]
                    const debtAmount = vessel.data[2]
                    this.adjustVessel(collateralAddress, collateralAmount, debtAmount)
                }
            }

            const closedVessels = actionStore.actions?.filter(x => x.type === ActionType.GravitaClose) || []
            for (const vessel of closedVessels) {
                const collateralAddress = vessel.calldata[0]
                this.closeVessel(collateralAddress)
            }
        },
    },
})