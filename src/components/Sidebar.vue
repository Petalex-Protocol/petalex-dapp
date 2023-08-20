<script setup lang="ts">
</script>

<template>
    <div class="drawer md:drawer-open">
        <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content">
            <RouterView class="p-4" />
            <label for="my-drawer-2" class="btn btn-circle btn-primary drawer-button xs:hidden fixed top-[50%] left-[-25px]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                </svg>
            </label>        
        </div> 
        <div class="drawer-side">
            <label for="my-drawer-2" class="drawer-overlay"></label> 
            <ul class="menu p-4 w-[250px] h-full bg-base-200 text-base-content">            
                <li class="collapse">
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
                <li class="collapse">
                    <input type="radio" name="my-accordion-1" /> 
                    <div class="collapse-title">
                        Liquity
                    </div>
                    <ul class="collapse-content"> 
                        <li><router-link to="/liquity/open">Open</router-link></li>
                        <li><a>Adjust</a></li>
                        <li><a>Close</a></li>
                    </ul>
                </li>
                <li class="collapse">
                    <input type="radio" name="my-accordion-1" /> 
                    <div class="collapse-title">
                        Utilities
                    </div>
                    <ul class="collapse-content"> 
                        <li><a>Flash Loan</a></li>
                        <li><a>Exchange</a></li>
                    </ul>
                </li>
            </ul>
        
        </div>
    </div>
</template>

<style scoped>
</style>
