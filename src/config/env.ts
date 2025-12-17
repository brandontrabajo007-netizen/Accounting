// src/config/env.ts
type NodeEnv = 'development' | 'production'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${name}`)
  }
  return value
}

export const env = {
  nodeEnv: (process.env.NODE_ENV ?? 'development') as NodeEnv,

  app: {
    port: Number(process.env.PORT ?? 3000),
    url: required('APP_URL'),
  },

  db: {
    mongoUri: required('MONGO_URI'),
    mongoDbName: required('MONGO_DB_NAME'),
  },

  telegram: {
    token: required('TELEGRAM_BOT_TOKEN'),
    webhookUrl: (process.env.NODE_ENV === 'production' ? required('TELEGRAM_WEBHOOK_URL') : process.env.TELEGRAM_WEBHOOK_URL) ?? null,
  },

  cookies: {
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAMESITE ?? 'lax') as 'lax' | 'none',
  },
}
