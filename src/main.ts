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
        
        // Chains.optimism,
        // import.meta.env.MODE === 'development' ? 
        {
            id: 1,
            name: 'Ethereum Devnet',
            network: Chains.mainnet.network,
            nativeCurrency: Chains.mainnet.nativeCurrency,
            rpcUrls: {
                default: {
                    http: [import.meta.env.VITE_TENDERLY_RPC],
                    webSocket: [],
                },
                public: {
                    http: [import.meta.env.VITE_TENDERLY_RPC],
                    webSocket: [],
                }
            },
            blockExplorers: Chains.mainnet.blockExplorers,
            contracts: Chains.mainnet.contracts,
        },
        Chains.arbitrum,
        // : Chains.mainnet,
    ],
    enableCustomProvider: true,
}))
app.use(router)

app.mount('#app')
