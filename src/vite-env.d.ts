/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 公開デモ用のサンプルモード（"1" で有効） */
  readonly VITE_DEMO_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
