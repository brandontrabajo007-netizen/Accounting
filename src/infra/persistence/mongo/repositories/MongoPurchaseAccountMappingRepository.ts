import type { PurchaseAccountMappingRepository } from '@application/eventos/Purchase/ports/PurchaseAccountMappingRepository'
import type { PurchaseAccountConfig } from '@domain/events/purchase/PurchaseAccountConfig'
import { toPurchaseAccountConfig } from '../mappers/purchaseAccountMapping.mapper'
import { PurchaseAccountMappingModel } from '../models/PurchaseAccountMapping.model'

export class MongoPurchaseAccountMappingRepository implements PurchaseAccountMappingRepository {
  async getPurchaseAccountMappingByCompanyId(companyId: string): Promise<PurchaseAccountConfig> {
    const doc = await PurchaseAccountMappingModel.findOne({ companyId }).lean()

    if (!doc) {
      throw new Error(`No purchase account mapping found for company ${companyId}`)
    }

    // doc ya es compatible con PurchaseAccountMappingDocument por el modelo tipado
    return toPurchaseAccountConfig(doc)
  }
}
