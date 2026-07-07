/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONFIGHUB_BASE_URL?: string;
  readonly VITE_OAUTH_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
