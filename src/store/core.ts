import { defineStore } from "pinia"
import { erc20ABI, multicall, account } from '@kolirt/vue-web3-auth'
import adminAbi from '../abi/gravita/admin.json'
import priceFeedAbi from '../abi/gravita/pricefeed.json'
import oracleAbi from '../abi/gravita/oracle.json'

export enum Network {
    goerli = "goerli",
    homestead = "homestead",
    arbitrum = "arbitrum",
    optimism = "optimism",
}

export enum Address {
    petalexNft = "petalexNft",
    actioneExecutor = "actioneExecutor",
    gravitaAdmin = "gravitaAdmin",
    gravitaVesselManagerOperations = "gravitaVesselManagerOperations",
    gravitaSortedVessels = "gravitaSortedVessels",
}

export interface AddressMap {
    name: string
    address: string
}

export interface AddressNetworkMap {
    network: Network
    addresses: AddressMap[]
}

export interface CoreState {
    addresses: AddressNetworkMap[]
    connectedNetwork: Network
    gravitaCollateralInfo: GravitaCollateralInfo[]
}

export interface GravitaCollateralInfo {
    mintCap: string
    minNetDebt: string
    totalAssetDebt: string
    address: string
    name: string
    decimals: number
    balanceOf: string
    symbol: string
    isActive: boolean
    minCollateralRatio: string
    recoveryCollateralRadio: string
    priceFeed: string
    price: string
    priceDecimals: string
    isPriceEthIndexed: boolean
}

export const useCoreStore = defineStore({
    id: "core",
    state: () =>
        ({
            addresses: [
                {
                    network: Network.goerli,
                    addresses: [
                        {
                            name: Address.petalexNft,
                            address: "0x0",
                        },
                        {
                            name: Address.gravitaAdmin,
                            address: "0xfE4d1A4616Db87a669B9A5eA9E9092cb0cA36511",
                        },
                        {
                            name: Address.gravitaVesselManagerOperations,
                            address: "0x0",
                        },
                        {
                            name: Address.gravitaSortedVessels,
                            address: "0x0",
                        },
                    ],
                },
                {
                    network: Network.homestead,
                    addresses: [
                        {
                            name: Address.petalexNft,
                            address: "0x0",
                        },
                        {
                            name: Address.gravitaAdmin,
                            address: "0xf7Cc67326F9A1D057c1e4b110eF6c680B13a1f53",
                        },
                        {
                            name: Address.gravitaVesselManagerOperations,
                            address: "0x0",
                        },
                        {
                            name: Address.gravitaSortedVessels,
                            address: "0x0",
                        },
                    ],
                },
                {
                    network: Network.arbitrum,
                    addresses: [
                        {
                            name: Address.petalexNft,
                            address: "0x0",
                        },
                        {
                            name: Address.gravitaAdmin,
                            address: "0x4928c8F8c20A1E3C295DddBe05095A9aBBdB3d14",
                        },
                        {
                            name: Address.gravitaVesselManagerOperations,
                            address: "0x0",
                        },
                        {
                            name: Address.gravitaSortedVessels,
                            address: "0x0",
                        },
                    ],
                },
            ],
            connectedNetwork: Network.goerli,
            gravitaCollateralInfo: [],
        } as CoreState),
    getters: {
        getNetworkAddressMap: (state: CoreState): AddressMap[] | undefined => {
            return state.addresses.find(x => x.network == state.connectedNetwork)?.addresses;
        },
        getAddress: (state: CoreState) => {
            return (name: Address) => state.addresses.find(x => x.network == state.connectedNetwork)?.addresses.find(x => x.name == name)?.address;  
        },
    },
    actions: {
        setCurrentNetwork(network: Network) {         
            this.connectedNetwork = network
        },
        async getGravitaCollateralInfo() {
            this.gravitaCollateralInfo = []
            const address = this.getAddress(Address.gravitaAdmin)
            if (!address || !account.connected) {
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
                    symbol: '',
                    isActive: false,
                    minCollateralRatio: '0',
                    recoveryCollateralRadio: '0',
                    priceFeed: '',
                    price: '0',
                    priceDecimals: '8',
                    isPriceEthIndexed: false,
                })
                collateralCalls.push({
                    abi: erc20ABI,
                    contractAddress: collateral as `0x${string}`,
                    calls: [
                        ['name', []],
                        ['symbol', []],
                        ['decimals', []],
                        ['balanceOf', [account.address]]
                    ],
                })
                priceFeedCalls.push({
                    abi: priceFeedAbi,
                    contractAddress: priceFeed as `0x${string}`,
                    calls: [
                        ['oracles', [collateral]],
                    ],
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
                ]
            })

            // Parse the results into the info objects
            i = 0
            let j = 1
            let k = 0
            let adminMod = 6 // number of admin contract calls
            let ercMod = 4 // number of erc20 calls
            let priceFeedMod = 1 // number of price feed calls
            let adminCalls = true
            let processingCollateralCalls = false
            let processingPriceFeedCalls = false

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
                        }
                    } else {
                        throw new Error(`Error getting collateral info: ${data}`)
                    }
                } else {
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
                }
                if ((adminCalls && (j % adminMod === 0)) || (processingCollateralCalls && (j % ercMod === 0)) || (processingPriceFeedCalls && (j % priceFeedMod === 0))) {
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

            this.gravitaCollateralInfo = infos
        },
        async calculateGravitaHints(address, coll, debt) {
            // TODO: implement
            return { upperHint: '0x0', lowerHint: '0x0' }
        }
    },
})
