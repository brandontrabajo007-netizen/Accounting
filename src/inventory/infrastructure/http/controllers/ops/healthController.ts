import type { Request, Response } from 'express'

export async function inventoryHealthHandler(_req: Request, res: Response) {
  return res.json({ status: 'ok' })
}
