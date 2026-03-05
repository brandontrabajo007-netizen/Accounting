import type { Request, Response } from 'express'

const version = process.env.npm_package_version ?? 'unknown'

export async function inventoryVersionHandler(_req: Request, res: Response) {
  return res.json({ version })
}
