import type { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '@infra/http/middleware/auth'

export function requireInventoryAuth(req: Request, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (!req.user?.companyId) {
      return res.status(401).json({ ok: false, error: 'Usuario no autenticado o sin companyId' })
    }
    next()
  })
}
