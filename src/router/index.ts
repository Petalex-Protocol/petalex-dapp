import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router"

declare module "vue-router" {
    interface RouteMeta {
        requiresMint?: boolean
    }
}

const routes: Array<RouteRecordRaw> = [
    {
        path: "/",
        component: () => import("../components/petalex/PetalexBase.vue"),
        children: [
            {
                path: "mint",
                component: () => import("../components/petalex/PetalexMint.vue"),
            },
            {
                path: "select",
                component: () => import("../components/petalex/PetalexSelect.vue"),
            },
            {
                path: "gravita",
                component: () => import("../components/gravita/GravitaBase.vue"),
                children: [
                    {
                        path: "open",
                        component: () => import("../components/gravita/GravitaOpen.vue"),
                    },
                    {
                        path: "adjust",
                        component: () => import("../components/gravita/GravitaAdjust.vue"),
                    },
                    {
                        path: "close",
                        component: () => import("../components/gravita/GravitaClose.vue"),
                    }
                ],
                meta: {
                    requiresMint: true
                }
            },
            {
                path: "liquity",
                component: () => import("../components/liquity/LiquityBase.vue"),
                children: [
                    {
                        path: "open",
                        component: () => import("../components/liquity/LiquityOpen.vue"),
                    },
                    {
                        path: "adjust",
                        component: () => import("../components/liquity/LiquityAdjust.vue"),
                    },
                    {
                        path: "close",
                        component: () => import("../components/liquity/LiquityClose.vue"),
                    }
                ],
                meta: {
                    requiresMint: true
                }
            },
            {
                path: "utilities",
                component: () => import("../components/utilities/UtilitiesBase.vue"),
                children: [
                    {
                        path: "flash",
                        component: () => import("../components/utilities/UtilitiesFlash.vue"),
                    },
                    {
                        path: "exchange",
                        component: () => import("../components/utilities/UtilitiesExchange.vue"),
                    },
                    {
                        path: "wrap",
                        component: () => import("../components/utilities/UtilitiesWrap.vue"),
                    },
                    {
                        path: "unwrap",
                        component: () => import("../components/utilities/UtilitiesUnwrap.vue"),
                    },
                    {
                        path: "pull",
                        component: () => import("../components/utilities/UtilitiesPull.vue"),
                    },
                    {
                        path: "send",
                        component: () => import("../components/utilities/UtilitiesSend.vue"),
                    },
                ],
                meta: {
                    requiresMint: true
                }
            },
        ],
    },    
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

export default router
