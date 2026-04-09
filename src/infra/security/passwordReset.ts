import { PasswordResetTokenMongoModel } from '@infra/persistence/mongo/models/PasswordResetTokenModel'
import { createHash, randomBytes } from 'node:crypto'

const DEFAULT_EXPIRATION_MINUTES = 20
const MIN_EXPIRATION_MINUTES = 5
const MAX_EXPIRATION_MINUTES = 120

const normalizeBaseUrl = (value: string | undefined | null): string | null => {
  if (!value) return null
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (!/^https?:$/i.test(parsed.protocol)) return null
    return parsed.toString().replace(/\/+$/, '')
  } catch {
    return null
  }
}

const getFirstCorsOrigin = (): string | null => {
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => normalizeBaseUrl(origin))
    .filter((origin): origin is string => Boolean(origin))
  return origins[0] ?? null
}

const getPasswordResetExpirationMinutes = (): number => {
  const configured = Number(process.env.PASSWORD_RESET_EXPIRATION_MINUTES ?? DEFAULT_EXPIRATION_MINUTES)
  if (!Number.isFinite(configured)) return DEFAULT_EXPIRATION_MINUTES
  return Math.max(MIN_EXPIRATION_MINUTES, Math.min(MAX_EXPIRATION_MINUTES, Math.round(configured)))
}

export const getPasswordResetFrontendBaseUrl = () => {
  const configured =
    normalizeBaseUrl(process.env.PASSWORD_RESET_FRONTEND_URL) ??
    normalizeBaseUrl(process.env.FRONTEND_URL) ??
    getFirstCorsOrigin() ??
    normalizeBaseUrl(process.env.APP_URL) ??
    'http://localhost:5173'

  if (process.env.NODE_ENV === 'production' && /^http:\/\/localhost(?::\d+)?$/i.test(configured)) {
    console.warn('[auth] Password reset link is using localhost in production. Set PASSWORD_RESET_FRONTEND_URL.')
  }

  return configured
}

const hashPasswordResetToken = (rawToken: string): string => {
  return createHash('sha256').update(rawToken).digest('hex')
}

export type IssuedPasswordResetLink = Readonly<{
  token: string
  resetUrl: string
  expiresAt: Date
}>

export async function issuePasswordResetLink(params: {
  userId: string
  companyId: string
  requestedByUserId?: string | null
}): Promise<IssuedPasswordResetLink> {
  const now = new Date()
  const expirationMinutes = getPasswordResetExpirationMinutes()
  const expiresAt = new Date(now.getTime() + expirationMinutes * 60_000)
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashPasswordResetToken(token)

  await PasswordResetTokenMongoModel.updateMany(
    {
      userId: params.userId,
      usedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { usedAt: now } },
  )

  await PasswordResetTokenMongoModel.create({
    userId: params.userId,
    companyId: params.companyId,
    tokenHash,
    requestedByUserId: params.requestedByUserId ?? null,
    expiresAt,
  })

  const resetUrl = `${getPasswordResetFrontendBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`
  return { token, resetUrl, expiresAt }
}

export async function isPasswordResetTokenValid(rawToken: string): Promise<boolean> {
  const token = rawToken.trim()
  if (!token) return false
  const tokenHash = hashPasswordResetToken(token)
  const now = new Date()
  const count = await PasswordResetTokenMongoModel.countDocuments({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: now },
  })
  return count > 0
}

export async function consumePasswordResetToken(rawToken: string): Promise<{ userId: string; companyId: string } | null> {
  const token = rawToken.trim()
  if (!token) return null
  const now = new Date()
  const tokenHash = hashPasswordResetToken(token)

  const doc = await PasswordResetTokenMongoModel.findOneAndUpdate(
    {
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { usedAt: now } },
    { new: true },
  )

  if (!doc) return null
  return { userId: doc.userId, companyId: doc.companyId }
}

const canUseTelegramUrlButton = (url: string): boolean => {
  if (!/^https:\/\//i.test(url)) return false
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false
    if (host.endsWith('.local')) return false
    return true
  } catch {
    return false
  }
}

const resetExpiresFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  dateStyle: 'medium',
  timeStyle: 'short',
})

export type PasswordResetTelegramPayload = Readonly<{
  text: string
  replyMarkup: {
    inline_keyboard: Array<Array<{ text: string; url?: string; copy_text?: { text: string } }>>
  }
}>

export const buildPasswordResetTelegramPayload = (resetUrl: string, expiresAt: Date): PasswordResetTelegramPayload => {
  const canOpenDirectly = canUseTelegramUrlButton(resetUrl)
  const expiresLabel = resetExpiresFormatter.format(expiresAt)
  const openHint = canOpenDirectly ? 'Toca "Abrir enlace" para continuar.' : 'Si no puedes abrir directo, usa "Copiar enlace".'

  const text = [
    '🔐 *Recuperacion segura de contrasena*',
    '',
    'Recibimos una solicitud para cambiar tu contrasena.',
    '',
    `⏳ Vigencia: ${expiresLabel} (America/Bogota)`,
    '🔒 Enlace personal y de un solo uso.',
    '🛡️ Nunca te pediremos la contrasena por chat.',
    '',
    openHint,
    '',
    `Enlace: ${resetUrl}`,
    '',
    'Si no solicitaste este cambio, ignora este mensaje.',
  ].join('\n')

  const firstRow = canOpenDirectly ? [{ text: 'Abrir enlace', url: resetUrl }] : []
  const secondRow = [{ text: 'Copiar enlace', copy_text: { text: resetUrl } }]

  return {
    text,
    replyMarkup: {
      inline_keyboard: [...(firstRow.length ? [firstRow] : []), [secondRow[0]]],
    },
  }
}
