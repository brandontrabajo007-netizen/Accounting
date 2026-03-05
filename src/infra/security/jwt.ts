import type { JwtPayload } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'

export interface ApiTokenPayload extends JwtPayload {
  userId: string
  companyId: string
  role?: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '12h') as jwt.SignOptions['expiresIn']

export const generateToken = (payload: ApiTokenPayload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const verifyToken = (token: string): ApiTokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as ApiTokenPayload
  } catch {
    return null
  }
}
