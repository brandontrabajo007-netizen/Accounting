import { generateToken } from '@infra/security/jwt'
import {
  buildPasswordResetTelegramPayload,
  consumePasswordResetToken,
  isPasswordResetTokenValid,
  issuePasswordResetLink,
} from '@infra/security/passwordReset'
import { TelegramClient } from '@infra/telegram/telegramClient'
import bcrypt from 'bcrypt'
import express from 'express'
import { userRepository } from '../dependencies'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

const normalizePhone = (rawValue: unknown): string => {
  const raw = typeof rawValue === 'string' ? rawValue : ''
  return raw.trim().replace(/\s+/g, '')
}

const validateNewPassword = (value: unknown): string | null => {
  const password = typeof value === 'string' ? value : ''
  if (password.length < 8) return 'La nueva contrasena debe tener al menos 8 caracteres'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'La nueva contrasena debe incluir letras y numeros'
  }
  return null
}

const maybeSendResetLinkByTelegram = async (params: {
  telegramId?: number
  resetUrl: string
  expiresAt: Date
}): Promise<boolean> => {
  if (!params.telegramId || !Number.isFinite(params.telegramId)) return false
  try {
    const telegramPayload = buildPasswordResetTelegramPayload(params.resetUrl, params.expiresAt)
    await TelegramClient.sendMessage({
      chatId: params.telegramId,
      text: telegramPayload.text,
      replyMarkup: telegramPayload.replyMarkup,
    })
    return true
  } catch (error) {
    console.error('No pude enviar link de recuperacion por Telegram:', error)
    return false
  }
}

router.post('/login', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone)
    const password = req.body?.password

    if (!phone || !password) {
      return res.status(400).json({ error: 'phone y password son requeridos' })
    }

    const user = await userRepository.findByPhone(phone)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    if (!user.password) {
      return res.status(500).json({ error: 'El usuario no tiene password configurada' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales invalidas' })
    }

    const token = generateToken({
      userId: user.id,
      companyId: user.companyId,
    })

    res.cookie('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 12,
    })

    const { password: _omit, ...safeUser } = user
    return res.json({ status: true, token, user: safeUser })
  } catch (err) {
    console.error('Error en login:', err)
    return res.status(500).json({ error: 'Error en servidor' })
  }
})

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: 'No autenticado' })

    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword y newPassword son requeridos' })
    }

    const passwordValidationError = validateNewPassword(newPassword)
    if (passwordValidationError) {
      return res.status(400).json({ error: passwordValidationError })
    }

    const user = await userRepository.findById(userId)
    if (!user || !user.password) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'La contrasena actual no coincide' })
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return res.status(400).json({ error: 'La nueva contrasena debe ser diferente a la actual' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await userRepository.update(user.id, { password: hashed })
    return res.json({ status: true, message: 'Contrasena actualizada' })
  } catch (err) {
    console.error('Error cambiando contrasena:', err)
    return res.status(500).json({ error: 'Error en servidor' })
  }
})

router.post('/password-reset/request', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone)
    if (!phone) {
      return res.status(400).json({ error: 'phone es requerido' })
    }

    const safeMessage = 'Si el telefono esta registrado, enviaremos un enlace de recuperacion por Telegram.'
    const user = await userRepository.findByPhone(phone)
    if (!user) {
      return res.json({ status: true, message: safeMessage })
    }

    const issued = await issuePasswordResetLink({
      userId: user.id,
      companyId: user.companyId,
    })

    const sentViaTelegram = await maybeSendResetLinkByTelegram({
      telegramId: user.telegramId,
      resetUrl: issued.resetUrl,
      expiresAt: issued.expiresAt,
    })

    return res.json({
      status: true,
      message: safeMessage,
      sentViaTelegram,
      ...(process.env.NODE_ENV === 'development'
        ? {
            devResetUrl: issued.resetUrl,
            devExpiresAt: issued.expiresAt,
          }
        : {}),
    })
  } catch (err) {
    console.error('Error solicitando recuperacion:', err)
    return res.status(500).json({ error: 'Error en servidor' })
  }
})

router.post('/password-reset/request-admin', authMiddleware, async (req, res) => {
  try {
    const requester = req.user
    if (!requester?.userId || !requester.companyId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const phone = normalizePhone(req.body?.phone)
    const requestedUserId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : ''
    const sendViaTelegram = req.body?.sendViaTelegram !== false

    if (!phone && !requestedUserId) {
      return res.status(400).json({ error: 'Debes enviar userId o phone' })
    }

    const targetUser = requestedUserId ? await userRepository.findById(requestedUserId) : await userRepository.findByPhone(phone)
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    if (targetUser.companyId !== requester.companyId) {
      return res.status(403).json({ error: 'No puedes generar enlaces para usuarios de otra empresa' })
    }

    const issued = await issuePasswordResetLink({
      userId: targetUser.id,
      companyId: targetUser.companyId,
      requestedByUserId: requester.userId,
    })

    const sentViaTelegram = sendViaTelegram
      ? await maybeSendResetLinkByTelegram({
          telegramId: targetUser.telegramId,
          resetUrl: issued.resetUrl,
          expiresAt: issued.expiresAt,
        })
      : false

    return res.json({
      status: true,
      resetUrl: issued.resetUrl,
      expiresAt: issued.expiresAt,
      sentViaTelegram,
    })
  } catch (err) {
    console.error('Error generando enlace admin:', err)
    return res.status(500).json({ error: 'Error en servidor' })
  }
})

router.get('/password-reset/validate', async (req, res) => {
  try {
    const token = String(req.query.token ?? '').trim()
    if (!token) {
      return res.status(400).json({ status: false, valid: false, error: 'token es requerido' })
    }

    const valid = await isPasswordResetTokenValid(token)
    return res.json({ status: true, valid })
  } catch (err) {
    console.error('Error validando token de recuperacion:', err)
    return res.status(500).json({ status: false, valid: false, error: 'Error en servidor' })
  }
})

router.post('/password-reset/confirm', async (req, res) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : ''
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'token y newPassword son requeridos' })
    }

    const passwordValidationError = validateNewPassword(newPassword)
    if (passwordValidationError) {
      return res.status(400).json({ error: passwordValidationError })
    }

    const consumed = await consumePasswordResetToken(token)
    if (!consumed) {
      return res.status(400).json({ error: 'El enlace no es valido o ya expiro' })
    }

    const user = await userRepository.findById(consumed.userId)
    if (!user || user.companyId !== consumed.companyId) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await userRepository.update(user.id, { password: hashed })

    return res.json({ status: true, message: 'Contrasena actualizada correctamente' })
  } catch (err) {
    console.error('Error confirmando recuperacion de contrasena:', err)
    return res.status(500).json({ error: 'Error en servidor' })
  }
})

router.get('/me', authMiddleware, (req, res) => {
  return res.json({
    user: req.user,
  })
})

router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  })

  return res.json({ status: true, message: 'Sesion cerrada' })
})

export default router
