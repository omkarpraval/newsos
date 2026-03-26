/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY: string
  readonly VITE_NEWSAPI_KEY: string
  readonly VITE_GNEWS_KEY: string
  readonly VITE_ELEVENLABS_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
