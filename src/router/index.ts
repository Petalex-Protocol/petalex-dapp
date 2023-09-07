import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router"

const routes: Array<RouteRecordRaw> = [
    {
        path: "/",
        component: () => import("../components/petalex/PetalexBase.vue"),
        children: [
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
                ],
            },
        ],
    },    
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

export default router
