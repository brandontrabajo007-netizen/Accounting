import type { InventorySettingsRepo } from '../../application/ports/InventorySettingsRepo'
import type { InventorySettings } from '../../domain/entities/InventorySettings'
import type { InventorySettingsDoc } from '../db/mongo/models/InventorySettingsModel'
import { InventorySettingsModel } from '../db/mongo/models/InventorySettingsModel'

const toDomain = (doc: InventorySettingsDoc): InventorySettings => ({
  companyId: doc.companyId,
  mode: doc.mode,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
})

export class MongoInventorySettingsRepo implements InventorySettingsRepo {
  async getByCompanyId(companyId: string): Promise<InventorySettings | null> {
    const doc = await InventorySettingsModel.findOne({ companyId }).lean().exec()
    return doc ? toDomain(doc) : null
  }

  async upsertMode(companyId: string, mode: 'SIMPLE' | 'VARIANT'): Promise<InventorySettings> {
    const now = new Date()
    const doc = await InventorySettingsModel.findOneAndUpdate(
      { companyId },
      {
        $set: {
          mode,
          updatedAt: now,
        },
        $setOnInsert: {
          companyId,
          createdAt: now,
        },
      },
      {
        upsert: true,
        new: true,
      },
    )
      .lean()
      .exec()

    if (!doc) {
      throw new Error('No se pudo guardar la configuracion de inventario')
    }

    return toDomain(doc)
  }
}
