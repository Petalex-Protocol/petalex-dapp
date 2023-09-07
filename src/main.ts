import { createApp } from 'vue'
import router from "./router"
import { createPinia } from "pinia"
import { createHead } from "@vueuse/head"
import {Chains, createWeb3Auth} from '@kolirt/vue-web3-auth'
import App from './App.vue'

import './app.css'

const app = createApp(App)
app.use(createPinia())
app.use(createHead())
app.use(createWeb3Auth({
    projectId: import.meta.env.VITE_PROJECT_ID,
    chains: [
        // Chains.goerli,
        // Chains.mainnet,
        Chains.arbitrum,
        // Chains.optimism,
        {
            id: 1,
            name: 'Ethereum Devnet',
            network: Chains.mainnet.network,
            nativeCurrency: Chains.mainnet.nativeCurrency,
            rpcUrls: {
                default: {
                    http: ['https://rpc.tenderly.co/fork/bf5221c3-8a06-4676-a2e7-b43f5fe38b4e'],
                    webSocket: [],
                },
                public: {
                    http: ['https://rpc.tenderly.co/fork/bf5221c3-8a06-4676-a2e7-b43f5fe38b4e'],
                    webSocket: [],
                }
            },
            blockExplorers: Chains.mainnet.blockExplorers,
            contracts: Chains.mainnet.contracts,
        },
    ],
    enableCustomProvider: true,
}))
app.use(router)

app.mount('#app')
