import { generateToken } from '@infra/security/jwt'
import bcrypt from 'bcrypt'
import express from 'express'
import { userRepository } from '../dependencies'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    // Normalizar teléfono
    const rawPhone = req.body.phone || ''
    const phone = rawPhone.trim().replace(/\s+/g, '')
    const password = req.body.password

    console.log('Phone recibido:', rawPhone)
    console.log('Phone normalizado:', phone)

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
      return res.status(401).json({ error: 'Credenciales inválidas' })
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

    return res.json({ user: safeUser })
  } catch (err) {
    console.error('Error en login:', err)
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

  return res.json({ status: true, message: 'Sesión cerrada' })
})

export default router
