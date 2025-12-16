import type { JwtPayload } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'

export interface ApiTokenPayload extends JwtPayload {
  userId: string
  companyId: string
  role?: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export const generateToken = (payload: ApiTokenPayload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30m' })
}

export const verifyToken = (token: string): ApiTokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as ApiTokenPayload
  } catch {
    return null
  }
}
