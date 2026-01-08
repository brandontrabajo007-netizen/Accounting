import type { AccountsReceivableSettingsRepository } from '../../../../application/ports/AccountsReceivableSettingsRepository'
import type { AccountsReceivableSettings } from '../../../../domain/AccountsReceivableSettings'
import { ArSettingsMongoModel } from '../models/ArSettingsModel'

interface ArSettingsDocument {
  companyId: string
  enabled: boolean
  defaultCreditWhenMissingPaymentMethod: boolean
  createdAt: Date
  updatedAt: Date
}

const toDomain = (doc: ArSettingsDocument): AccountsReceivableSettings => ({
  companyId: doc.companyId,
  enabled: doc.enabled,
  defaultCreditWhenMissingPaymentMethod: doc.defaultCreditWhenMissingPaymentMethod,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
})

export class MongoArSettingsRepository implements AccountsReceivableSettingsRepository {
  async getByCompanyId(companyId: string): Promise<AccountsReceivableSettings | null> {
    const doc = await ArSettingsMongoModel.findOne({ companyId }).lean()
    return doc ? toDomain(doc) : null
  }

  async save(settings: AccountsReceivableSettings): Promise<AccountsReceivableSettings> {
    const doc = await ArSettingsMongoModel.findOneAndUpdate(
      { companyId: settings.companyId },
      {
        $set: {
          enabled: settings.enabled,
          defaultCreditWhenMissingPaymentMethod: settings.defaultCreditWhenMissingPaymentMethod,
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
