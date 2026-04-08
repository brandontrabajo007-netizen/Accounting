import type { Request, Response } from 'express'
import { getInventorySettings, updateInventorySettings } from '../../dependencies'
import { updateInventorySettingsSchema } from '../../validation/adminSchemas'

const modeChangeMessages: Record<'HAS_MOVEMENTS' | 'HAS_RESERVATIONS' | 'HAS_USER_VARIANTS', string> = {
  HAS_MOVEMENTS: 'No se puede cambiar a SIMPLE porque ya existen movimientos de inventario.',
  HAS_RESERVATIONS: 'No se puede cambiar a SIMPLE porque existen reservas registradas.',
  HAS_USER_VARIANTS: 'No se puede cambiar a SIMPLE porque existen variantes creadas para la empresa.',
}

export async function getInventorySettingsHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const settings = await getInventorySettings({ companyId })
  return res.json({ mode: settings.mode })
}

export async function updateInventorySettingsHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const body = updateInventorySettingsSchema.parse(req.body)
  const result = await updateInventorySettings({ companyId, mode: body.mode })

  if (!result.ok) {
    if (result.error.type === 'InventoryModeChangeNotAllowed') {
      return res.status(409).json({
        ok: false,
        error: result.error,
        message: modeChangeMessages[result.error.reason],
      })
    }
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.json({ ok: true, mode: result.value.mode })
}
