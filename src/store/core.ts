import { defineStore } from "pinia"
import { erc20ABI, multicall, account, readContract, writeContract, fetchBalance, chain } from '@kolirt/vue-web3-auth'
import uniswapV3FactoryAbi from '../abi/uniswap/uniswapv3factory.json'
import uniswapQuoterV2Abi from '../abi/uniswap/uniswapquoterv2.json'
import petalexAbi from '../abi/petalex/petalexnft.json'
import { getRandomInt } from "../utils/math"
import { solidityPacked } from "ethers"
import { CoinResult, getCoins } from "../utils/defillama_api"
import { convertFromDecimals, standardiseDecimals } from "../utils/bn"

export const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export enum Network {
    // goerli = "goerli",
    homestead = "homestead",
    arbitrum = "arbitrum",
    // optimism = "optimism",
}

export enum Address {
    petalexNft = "petalexNft",
    actionExecutor = "actionExecutor",
    gravitaAdmin = "gravitaAdmin",
    gravitaVesselManagerOperations = "gravitaVesselManagerOperations",
    gravitaSortedVessels = "gravitaSortedVessels",
    gravitaDebtToken = "gravitaDebtToken",
    gravitaVesselManager = "gravitaVesselManager",
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
    availableTokens: Token[]
    tokensToQuery: AddressNetworkMap[]
    uniswapV3FeeTiers: number[]
    ownedTokens: number[]
    selectedToken: number
    selectedProxyAddress: string
}

export interface ActiveVessel {
    address: string
    hasVessel: boolean
}

export interface Token {
    address: string
    name: string
    symbol: string
    decimals: number
    price: string
    balanceOf: string
    balanceOfProxy: string
}

export const useCoreStore = defineStore({
    id: "core",
    state: () =>
        ({
            addresses: [                
                {
                    network: Network.homestead,
                    addresses: [
                        {
                            name: Address.petalexNft,
                            address: "0xF583a59c59F8dF885e118736E8ED2E7b3e25A671",
                        },
                        {
                            name: Address.actionExecutor,
                            address: "0x0bd0C23B9AAdb4af399F812B18Ff5619f7507Cfa",
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
                            name: Address.gravitaVesselManager,
                            address: '0xdB5DAcB1DFbe16326C3656a88017f0cB4ece0977'
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
                            name: Address.gravitaVesselManager,
                            address: '0x6AdAA3eBa85c77e8566b73AEfb4C2f39Df4046Ca'
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
            connectedNetwork: Network.homestead,
            availableTokens: [],
            tokensToQuery: [                
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
            ownedTokens: [],
            selectedToken: -1,
            selectedProxyAddress: '',
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
        async getPoolAddress(token0: Token, token1: Token, fee: number) {
            return await readContract({
                address: this.getAddress(Address.uniswapV3Factory) as `0x${string}`,
                abi: uniswapV3FactoryAbi,
                functionName: 'getPool',
                args: [token0.address, token1.address, fee],
            })
        },
        async getGeneralTokenInfo() {
            const petalexNftAddress = this.getAddress(Address.petalexNft)
            if (!petalexNftAddress || !account.connected || this.ownedTokens.length === 0 || this.selectedToken === -1) {
                return
            }

            const addressMap = this.tokensToQuery.find(x => x.network === this.connectedNetwork)?.addresses.map(x => x.address)

            if (addressMap && addressMap.length > 0) {
                const promises = []

                const calls =  [
                    ['name', []],
                    ['symbol', []],
                    ['decimals', []],
                    ['balanceOf', [account.address]],
                    ['balanceOf', [this.selectedProxyAddress]]
                ]
                promises.push(multicall({
                    calls: [
                        ...addressMap.map((x: string) => ({
                            abi: erc20ABI,
                            contractAddress: x as `0x${string}`,
                            calls: calls,
                        })) as any[],
                    ]
                }))
                const defillamaNetwork = this.connectedNetwork === Network.homestead ? 'ethereum' : this.connectedNetwork
                promises.push(getCoins(addressMap.map(x => `${defillamaNetwork}:${x}`)))
                promises.push(fetchBalance({ address: account.address as `0x${string}` }))
                promises.push(fetchBalance({ address: this.selectedProxyAddress as `0x${string}` }))

                const promiseResult = await Promise.all(promises)

                const result = promiseResult[0] as unknown[]
                if (result.some((x: any) => x.status !== 'success')) {
                    console.log(result)
                    throw new Error(`Error getting general token info`)
                }
                
                const defillamaCoinResult = promiseResult[1] as CoinResult
                const tempAvailableTokens: Token[] = []

                let i = 0
                let increment = calls.length
                for (const a of addressMap) {
                    tempAvailableTokens.push({
                        address: a,
                        name: (result[i] as any).result,
                        symbol: (result[i + 1] as any).result,
                        decimals: (result[i + 2] as any).result,
                        price: defillamaCoinResult.coins[`${defillamaNetwork}:${a}`]?.price?.toString() || '0',
                        balanceOf: (result[i + 3] as any).result,
                        balanceOfProxy: (result[i + 4] as any).result,
                    })
                    i += increment
                }

                const balance = promiseResult[2] as any
                const proxyBalance = promiseResult[3] as any
                tempAvailableTokens.push({
                    address: NATIVE_ADDRESS, // special address for native token
                    name: chain.value.name,
                    price: defillamaCoinResult.coins[`coingecko:${chain.value.name.toLowerCase()}`]?.price?.toString() || '0',
                    balanceOf: balance.value.toString(),
                    balanceOfProxy: proxyBalance.value.toString(),
                    ...balance,
                })

                this.availableTokens = tempAvailableTokens
            }
        },
        async getUniswapV3Quote(token0: Token, token1: Token, amount: number, input: boolean, intermediateTokens: Token[] = []) {
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
        async getPetalexInfo(address: string) {
            const petalexNftAddress = this.getAddress(Address.petalexNft)
            if (!petalexNftAddress || !account.connected) {
                return
            }
            const ownedTokens = await readContract({
                address: petalexNftAddress as `0x${string}`,
                abi: petalexAbi,
                functionName: 'getOwnedTokens',
                args: [address],
            }) as number[]
            
            this.ownedTokens = ownedTokens
            if (ownedTokens.length > 0) {
                this.selectedToken = ownedTokens[0]
                await this.getProxyAddressForToken()
            }
        },
        async mintProxyWallets(amount: number, donation: bigint) {
            const petalexNftAddress = this.getAddress(Address.petalexNft)
            if (!account.connected || !petalexNftAddress) return

            // pick random integers for token ids that might be available
            // do this randomly so that there's less chance of conflict if multiple people mint at the same time
            let randomTokenIds = []
            let i = 0
            let actualAvailableTokenIds = []

            while(actualAvailableTokenIds.length < amount) {
                i = 0
                randomTokenIds = []
                for (i = 0; i < amount; ++i) {
                    randomTokenIds.push(getRandomInt())
                }

                const tokenResult = await multicall({
                    calls: [
                        {
                            abi: petalexAbi,
                            contractAddress: petalexNftAddress as `0x${string}`,
                            calls: [...randomTokenIds.map(x => ['isTokenIdAvailable', [x]])] as any[],
                        },
                    ]
                })
    
                i = 0
                for (const r of tokenResult) {
                    const data = r as any
                    if (data.status === 'success') {
                        if (data.result) {
                            actualAvailableTokenIds.push(randomTokenIds[i])
                        }
                    }
                    ++i
                }
            }

            return await writeContract({
                address: petalexNftAddress as `0x${string}`,
                abi: petalexAbi,
                functionName: 'mintBatch',
                args: [account.address, actualAvailableTokenIds, solidityPacked(['bytes'], ['0x'])],
                value: donation,
            })
        },
        async selectToken(tokenId: number) {
            this.selectedToken = tokenId
            await this.getProxyAddressForToken()
        },
        async getProxyAddressForToken() {
            const petalexNftAddress = this.getAddress(Address.petalexNft)
            if (!petalexNftAddress || !account.connected || this.ownedTokens.length === 0 || this.selectedToken === -1) {
                return
            }
            const proxyAddress = await readContract({
                address: petalexNftAddress as `0x${string}`,
                abi: petalexAbi,
                functionName: 'getProxyAddressForToken',
                args: [this.selectedToken],
            })

            this.selectedProxyAddress = proxyAddress as unknown as string
        },
        disconnect() {
            // reset state
            this.selectedProxyAddress = ''
            this.selectedToken = -1
            this.ownedTokens = []
            this.availableTokens = []            
        },
    },
})
