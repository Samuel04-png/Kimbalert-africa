/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_COUNTRY?: string;
  readonly VITE_AI_INSIGHTS_ENABLED?: string;
  readonly VITE_AI_MODE?: string;
  readonly VITE_AI_PROXY_URL?: string;
  readonly VITE_AI_ALLOW_CLIENT_DEEPSEEK?: string;
  readonly VITE_AI_USE_FIREBASE_FUNCTIONS?: string;
  readonly VITE_AI_FIREBASE_FUNCTION_NAME?: string;
  readonly VITE_ADMIN_OPS_USE_FIREBASE_FUNCTIONS?: string;
  readonly VITE_ADMIN_OPS_FUNCTION_NAME?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_FIREBASE_FUNCTIONS_REGION?: string;
  readonly VITE_FIREBASE_SEED_ON_EMPTY?: string;
  readonly VITE_DEEPSEEK_BASE_URL?: string;
  readonly VITE_DEEPSEEK_API_KEY?: string;
  readonly VITE_DEEPSEEK_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
