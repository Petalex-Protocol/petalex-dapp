import { defineStore } from "pinia"

export interface AppState {
    theme: string
}

export const useAppStore = defineStore({
    id: "app",
    state: () =>
        ({
            theme: localStorage.getItem("theme") || "notheme",
        } as AppState),
    getters: {
    },
    actions: {
        setTheme(theme: string) {
            this.theme = theme
            localStorage.setItem("theme", theme)
        },
    },
})
