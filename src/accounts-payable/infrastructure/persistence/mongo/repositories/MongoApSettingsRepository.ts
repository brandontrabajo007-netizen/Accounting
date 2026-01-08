import type { AccountsPayableSettingsRepository } from '../../../../application/ports/AccountsPayableSettingsRepository'
import type { AccountsPayableSettings } from '../../../../domain/AccountsPayableSettings'
import { ApSettingsMongoModel } from '../models/ApSettingsModel'

interface ApSettingsDocument {
  companyId: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

const toDomain = (doc: ApSettingsDocument): AccountsPayableSettings => ({
  companyId: doc.companyId,
  enabled: doc.enabled,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
})

export class MongoApSettingsRepository implements AccountsPayableSettingsRepository {
  async getByCompanyId(companyId: string): Promise<AccountsPayableSettings | null> {
    const doc = await ApSettingsMongoModel.findOne({ companyId }).lean()
    return doc ? toDomain(doc) : null
  }

  async save(settings: AccountsPayableSettings): Promise<AccountsPayableSettings> {
    const doc = await ApSettingsMongoModel.findOneAndUpdate(
      { companyId: settings.companyId },
      {
        $set: {
          enabled: settings.enabled,
        },
      },
      { upsert: true, new: true },
    ).lean()

    if (!doc) {
      return {
        ...settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    return toDomain(doc)
  }
}
