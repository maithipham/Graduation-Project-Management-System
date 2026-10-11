import { env } from './env'

export const appConfig = {
  apiBaseUrl: env.apiBaseUrl,
  apiTimeout: 30_000,
} as const
