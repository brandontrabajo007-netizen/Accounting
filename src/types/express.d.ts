import type { ApiTokenPayload } from '../../infra/security/jwt'

declare module 'express-serve-static-core' {
  interface Request {
    user?: ApiTokenPayload
  }
}
