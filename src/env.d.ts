/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM: string;
  readonly OFFERT_TO: string;
  readonly ADMIN_EMAILS: string;
  readonly JWT_SECRET: string;
  readonly KV_REST_API_URL: string;
  readonly KV_REST_API_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
