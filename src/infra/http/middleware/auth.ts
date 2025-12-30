import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../../security/jwt'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 🔐 1. leer token desde cookie
  const token = req.cookies?.auth_token

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  // 🔍 2. Verificar JWT
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  // 👤 3. inyectar usuario
  req.user = decoded

  next()
}
