/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_TRADINGVIEW_WIDGET_API: string
  readonly VITE_CHART_CAPTURE_INTERVAL: string
  readonly VITE_CHART_ANALYSIS_INTERVAL: string
  readonly VITE_ENABLE_LIVE_DATA: string
  readonly VITE_SYMBOL_ROTATION_INTERVAL: string
  readonly VITE_MAX_API_CALLS_PER_MINUTE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}