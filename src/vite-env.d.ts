/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_PROJECT_ID: string
    readonly VITE_TENDERLY_RPC: string
    // more env variables...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }