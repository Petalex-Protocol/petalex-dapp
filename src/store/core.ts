import { defineStore } from "pinia"
import { erc20ABI, multicall, account, readContract, chain } from '@kolirt/vue-web3-auth'
import adminAbi from '../abi/gravita/admin.json'
import priceFeedAbi from '../abi/gravita/pricefeed.json'
import vesselManagerOperationsAbi from '../abi/gravita/vesselmanageroperations.json'
import uniswapV3FactoryAbi from '../abi/uniswap/uniswapv3factory.json'
import uniswapQuoterV2Abi from '../abi/uniswap/uniswapquoterv2.json'
import sortedVesselsAbi from '../abi/gravita/sortedVessels.json'
import oracleAbi from '../abi/gravita/oracle.json'
import { getRandomInt } from "../utils/math"
import { useActionStore } from "./action"
import { Contract, JsonRpcProvider, solidityPacked } from "ethers"
import { CoinResult, getCoins } from "../utils/defillama_api"
import { convertFromDecimals, standardiseDecimals } from "../utils/bn"

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
    gravitaDebtToken = "gravitaDebtToken",
    uniswapV3Factory = "uniswapV3Factory",
    uniswapQuoterV2 = "uniswapQuoterV2",

    weth = "weth",
    dai = "dai",
    usdc = "usdc",
    usdt = "usdt",
    wbtc = "wbtc",
    link = "link",
    lusd = "lusd",
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
    activeVessels: ActiveVessel[]
    availableTokens: Token[]
    tokensToQuery: AddressNetworkMap[]
    uniswapV3FeeTiers: number[]
}

export interface ActiveVessel {
    address: string
    hasVessel: boolean
}

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
}

export interface Token {
    address: string
    name: string
    symbol: string
    decimals: number
    price: string
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
                            address: "0x6001E43a15c3c253960eB17ae062AC5F5436fe25",
                        },
                        {
                            name: Address.gravitaSortedVessels,
                            address: "0x652dbFCBcB0d3A2EA1DF9402085cd9E5b94D6E6D",
                        },
                        {
                            name: Address.gravitaDebtToken,
                            address: "0xb0e99590cF3Ddfdc19e68F91f7fe0626790cDb53",
                        },
                        {
                            name: Address.uniswapV3Factory,
                            address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
                        },
                        {
                            name: Address.uniswapQuoterV2,
                            address: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
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
                            address: "0xc49B737fa56f9142974a54F6C66055468eC631d0",
                        },
                        {
                            name: Address.gravitaSortedVessels,
                            address: "0xF31D88232F36098096d1eB69f0de48B53a1d18Ce",
                        },
                        {
                            name: Address.gravitaDebtToken,
                            address: "0x15f74458aE0bFdAA1a96CA1aa779D715Cc1Eefe4",
                        },
                        {
                            name: Address.uniswapV3Factory,
                            address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
                        },
                        {
                            name: Address.uniswapQuoterV2,
                            address: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
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
                            address: "0x15f74458aE0bFdAA1a96CA1aa779D715Cc1Eefe4",
                        },
                        {
                            name: Address.gravitaSortedVessels,
                            address: "0xc49B737fa56f9142974a54F6C66055468eC631d0",
                        },
                        {
                            name: Address.gravitaDebtToken,
                            address: "0x894134a25a5faC1c2C26F1d8fBf05111a3CB9487",
                        },
                        {
                            name: Address.uniswapV3Factory,
                            address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
                        },
                        {
                            name: Address.uniswapQuoterV2,
                            address: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
                        },
                    ],
                },
            ],
            connectedNetwork: Network.goerli,
            gravitaCollateralInfo: [],
            activeVessels: [],
            availableTokens: [],
            tokensToQuery: [
                {
                    network: Network.goerli,
                    addresses: [
                        {
                            name: Address.weth,
                            address: '',
                        }
                    ],
                },
                {
                    network: Network.homestead,
                    addresses: [
                        {
                            name: Address.weth,
                            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                        },
                        {
                            name: Address.usdc,
                            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                        },
                        {
                            name: Address.usdt,
                            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                        },
                        {
                            name: Address.dai,
                            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                        },
                        {
                            name: Address.gravitaDebtToken,
                            address: '0x15f74458aE0bFdAA1a96CA1aa779D715Cc1Eefe4',
                        },
                        {
                            name: Address.lusd,
                            address: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0',
                        },
                        {
                            name: Address.link,
                            address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
                        },
                        {
                            name: Address.wbtc,
                            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
                        },
                    ],
                },
                {
                    network: Network.arbitrum,
                    addresses: [
                        {
                            name: Address.weth,
                            address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
                        },
                        {
                            name: Address.usdc,
                            address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
                        },
                        {
                            name: Address.usdt,
                            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                        },
                        {
                            name: Address.dai,
                            address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
                        },
                        {
                            name: Address.gravitaDebtToken,
                            address: '0x894134a25a5faC1c2C26F1d8fBf05111a3CB9487',
                        },
                        {
                            name: Address.lusd,
                            address: '0x93b346b6BC2548dA6A1E7d98E9a421B42541425b',
                        },
                        {
                            name: Address.link,
                            address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
                        }
                    ],
                },
            ],
            uniswapV3FeeTiers: [100, 500, 3000, 10000],
        } as CoreState),
    getters: {
        getNetworkAddressMap: (state: CoreState): AddressMap[] | undefined => {
            return state.addresses.find(x => x.network == state.connectedNetwork)?.addresses;
        },
        getAddress: (state: CoreState) => {
            return (name: Address) => state.addresses.find(x => x.network == state.connectedNetwork)?.addresses.find(x => x.name == name)?.address;  
        },
        getAggregatedActiveVessels: (state: CoreState) => {
            const actionStore = useActionStore()
            const openedVessels = actionStore.actions?.filter(x => x.name === 'GravitaOpen') || []
            return [
                ...openedVessels.map(x => ({
                    address: x.calldata[0],
                    hasVessel: true
                })),
                ...state.activeVessels.filter(x => !openedVessels.find(y => y.calldata[0] === x.address))
            ]
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
        async calculateGravitaHints(collateralAddress: string, coll: bigint, debt: bigint) {
            const sortedVesselsAddress = this.getAddress(Address.gravitaSortedVessels)
            const vesselManagerOperationsAddress = this.getAddress(Address.gravitaVesselManagerOperations)
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
        async getBalances(addresses: string[]) {
            if (!account.connected || addresses.length === 0) {
                return []
            }
            const result = await multicall({
                calls: [
                    ...addresses.map((x: string) => ({
                        abi: erc20ABI,
                        contractAddress: x as `0x${string}`,
                        calls: [
                            ['balanceOf', [account.address]],
                            ['decimals', []]
                        ],
                    })) as any[],
                ]
            })

            if (result.some((x: any) => x.status !== 'success')) {
                throw new Error(`Error getting balances`)
            }
            return result.map((x: any) => x.result.toString())
        },
        async getActiveVessels() {
            // TODO: get proxy address from petalex nft and query gravita vessel manager for all collaterals
            this.activeVessels = this.gravitaCollateralInfo.map(x => ({ address: x.address, hasVessel: false } as ActiveVessel))
        },
        async getPoolAddress(token0: Token, token1: Token, fee: number) {
            return await readContract({
                address: this.getAddress(Address.uniswapV3Factory) as `0x${string}`,
                abi: uniswapV3FactoryAbi,
                functionName: 'getPool',
                args: [token0.address, token1.address, fee],
            })
        },
        async getGeneralTokenInfo() {
            const addressMap = this.tokensToQuery.find(x => x.network === this.connectedNetwork)?.addresses.map(x => x.address)

            if (addressMap && addressMap.length > 0) {
                const result = await multicall({
                    calls: [
                        ...addressMap.map((x: string) => ({
                            abi: erc20ABI,
                            contractAddress: x as `0x${string}`,
                            calls: [
                                ['name', []],
                                ['symbol', []],
                                ['decimals', []],
                            ],
                        })) as any[],
                    ]
                })

                if (result.some((x: any) => x.status !== 'success')) {
                    throw new Error(`Error getting general token info`)
                }


                const defillamaNetwork = this.connectedNetwork === Network.homestead ? 'ethereum' : this.connectedNetwork
                const defillamaCoinResult = await getCoins(addressMap.map(x => `${defillamaNetwork}:${x}`))

                const tempAvailableTokens: Token[] = []

                let i = 0
                for (const a of addressMap) {
                    tempAvailableTokens.push({
                        address: a,
                        name: (result[i] as any).result,
                        symbol: (result[i + 1] as any).result,
                        decimals: (result[i + 2] as any).result,
                        price: defillamaCoinResult.coins[`${defillamaNetwork}:${a}`]?.price?.toString() || '0',
                    })
                    i += 3
                }

                this.availableTokens = tempAvailableTokens
            }
        },
        async getUniswapV3Quote(token0: Token, token1: Token, amount: number, input: boolean, intermediateTokens: Token[] = []) {
            const provider = new JsonRpcProvider(chain.value.rpcUrls.default.http[0])
            const c = new Contract(this.getAddress(Address.uniswapQuoterV2) as string, uniswapQuoterV2Abi, provider) as any
            let bestQuote: bigint = BigInt(0)
            let bestPath: any[] = []
            let pathCallData: string = ''
            let priceImpact = 0

            let fromToken = token0
            let toToken = token1
            let hops = intermediateTokens
            if (!input) {
                fromToken = token1
                toToken = token0
                hops = intermediateTokens.reverse()
            }

            const convertedAmount = convertFromDecimals(amount, fromToken.decimals)
            const combinations = this.uniswapV3FeeTiers.length ** (hops.length + 1)

            // get all combinations of fee tiers for the hops as an array of arrays e.g. [[100, 100, 100], [100, 100, 500], [100, 100, 3000], [100, 100, 1000], [300, 100, 100], [300, 100, 300] ...]
            const feeTierCombinations: number[][] = []
            for (let i = 0; i < combinations; ++i) {
                const combination: number[] = []
                let j = i
                for (let k = 0; k < hops.length + 1; ++k) {
                    combination.push(this.uniswapV3FeeTiers[j % this.uniswapV3FeeTiers.length])
                    j = Math.floor(j / this.uniswapV3FeeTiers.length)
                }
                feeTierCombinations.push(combination)
            } // thank you copilot

            // get the best quote for each combination
            const allPaths = []
            for (const f of feeTierCombinations) {
                const types = f.reduce((p, c) => {
                    p.push('uint24')
                    p.push('address')
                    return p
                }, ['address'])
                const values = f.reduce((p, c, i) => {
                    p.push(c)
                    p.push(intermediateTokens[i]?.address || toToken.address)
                    return p
                }, [fromToken.address] as any[])
                allPaths.push(solidityPacked(types, values))
            }

            // don't care about gas for multicall as the lib does it for us
            const result = await multicall({
                calls: [
                    ...allPaths.map((x: string) => ({
                        abi: uniswapQuoterV2Abi,
                        contractAddress: this.getAddress(Address.uniswapQuoterV2) as `0x${string}`,
                        calls: [
                            [input ? 'quoteExactInput' : 'quoteExactOutput', [x, convertedAmount.toString()]],
                        ],
                    })) as any[],
                ]
            })

            // get the best quote
            let i = 0
            for (const r of result) {
                const data = r as any
                if (data.status === 'success') {
                    const quote = data.result[0]
                    if (bestQuote === BigInt(0)) {
                        bestQuote = quote
                        bestPath = feeTierCombinations[i]
                        pathCallData = allPaths[i]
                    } else if (input ? quote > bestQuote : quote < bestQuote) {
                        bestQuote = quote
                        bestPath = feeTierCombinations[i]
                        pathCallData = allPaths[i]
                    }
                }
                ++i
            }

            if (bestPath.length > 0) {
                // get general market price of token0 in token1
                const fromTokenPrice = Number(this.availableTokens.find(x => x.address === fromToken.address)?.price || '0') 
                const toTokenPrice = Number(this.availableTokens.find(x => x.address === toToken.address)?.price || '0')
                const marketPrice = fromTokenPrice / toTokenPrice

                // get price impact by comparing market price to uniswap quote
                const percentage = Number(standardiseDecimals(bestQuote, toToken.decimals)) / (marketPrice * amount)
                priceImpact = (input ? percentage - 1 : 1 - percentage) * 100
            }

            return { quote: bestQuote, path: bestPath, pathCallData, priceImpact }
        },
    },
})
