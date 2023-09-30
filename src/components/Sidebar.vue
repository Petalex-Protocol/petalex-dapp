<script setup lang="ts">
import ActionsBase from './actions/ActionsBase.vue'
import { onMounted, ref, watch } from 'vue'
import { useCoreStore } from '../store/core'
import { chain, account } from '@kolirt/vue-web3-auth'

const core = useCoreStore()

const loading = ref(false)

const init = async () => {
    if (!loading.value) {
        try {
            if (account.connected && account.address) {
                loading.value = true
                if (core.selectedProxyAddress === '') {
                    await core.getPetalexInfo(account.address)
                }
                await core.getGeneralTokenInfo()
            } else {
                core.disconnect()                
            }
        } catch (error) {
            console.log(error)
        } finally {
            loading.value = false
        }
    }
}

watch([chain, account], init)

onMounted(init)
</script>

<template>
    <div class="drawer md:drawer-open">
        <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content">
            <div v-if="!loading" class="flex flex-col justify-between h-full p-10">
                <RouterView class="p-4" />
                <ActionsBase />
            </div>
            <div v-else class="w-full text-center p-10">
                <span class="loading loading-spinner text-primary loading-md"></span>
            </div>
            <label for="my-drawer-2" class="btn btn-circle btn-primary drawer-button xs:hidden fixed top-[50%] left-[-25px]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                </svg>
            </label>        
        </div> 
        <div class="drawer-side">
            <label for="my-drawer-2" class="drawer-overlay"></label> 
            <ul class="menu p-4 w-[250px] h-full bg-base-100 border-solid border-e-2 border-primary"> 
                <li class="collapse">
                    <input type="radio" name="my-accordion-1" /> 
                    <div class="collapse-title">
                        Petalex
                    </div>
                    <ul class="collapse-content"> 
                        <li><router-link to="/mint">Mint</router-link></li>
                        <li><router-link to="/select">Select Proxy</router-link></li>
                    </ul>
                </li>           
                <li v-if="core.selectedProxyAddress" class="collapse">
                    <input type="radio" name="my-accordion-1" /> 
                    <div class="collapse-title">
                        Gravita
                    </div>
                    <ul class="collapse-content"> 
                        <li><router-link to="/gravita/open">Open</router-link></li>
                        <li><router-link to="/gravita/adjust">Adjust</router-link></li>
                        <li><router-link to="/gravita/close">Close</router-link></li>
                    </ul>
                </li>
                <li v-if="core.selectedProxyAddress" class="collapse">
                    <input type="radio" name="my-accordion-1" /> 
                    <div class="collapse-title">
                        Liquity
                    </div>
                    <ul class="collapse-content"> 
                        <li><router-link to="/liquity/open">Open</router-link></li>
                        <li><router-link to="/liquity/adjust">Adjust</router-link></li>
                        <li><router-link to="/liquity/close">Close</router-link></li>
                    </ul>
                </li>
                <li v-if="core.selectedProxyAddress" class="collapse">
                    <input type="radio" name="my-accordion-1" /> 
                    <div class="collapse-title">
                        Utilities
                    </div>
                    <ul class="collapse-content"> 
                        <li><router-link to="/utilities/flash">Flash Loan</router-link></li>
                        <li><router-link to="/utilities/exchange">Exchange</router-link></li>
                        <li><router-link to="/utilities/wrap">Wrap</router-link></li>
                        <li><router-link to="/utilities/unwrap">Unwrap</router-link></li>
                        <li><router-link to="/utilities/pull">Transfer to Proxy</router-link></li>
                        <li><router-link to="/utilities/send">Transfer from Proxy</router-link></li>
                    </ul>
                </li>
            </ul>
        
        </div>
    </div>
</template>

<style scoped>
</style>
