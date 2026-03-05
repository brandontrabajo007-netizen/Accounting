import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../../security/jwt'

const getBearerToken = (authorization?: string): string | null => {
  if (!authorization) return null

  const [scheme, token, ...rest] = authorization.trim().split(/\s+/)
  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
    return null
  }

  return token
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1) Authorization: Bearer <token> (server-to-server), 2) cookie (web)
  const token = getBearerToken(req.headers.authorization) ?? req.cookies?.auth_token

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  // Verificar JWT
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  // Inyectar usuario
  req.user = decoded

  next()
}
