/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_COUNTRY?: string;
  readonly VITE_AI_INSIGHTS_ENABLED?: string;
  readonly VITE_AI_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
