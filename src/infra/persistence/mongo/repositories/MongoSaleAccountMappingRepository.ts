import type { SaleAccountMappingRepository } from '@application/eventos/sales/ports/SaleAccountMappingRepository'
import type { SaleAccountConfig } from '@domain/events/sale/SaleAccountConfig'
import { mongoToSaleAccountConfig } from '../mappers/saleAccountMapping.mapper'
import { SaleAccountMappingModel } from '../models/saleAccountMapping.model'

export class MongoSaleAccountMappingRepository implements SaleAccountMappingRepository {
  async getSaleAccountMappingByCompanyId(companyId: string): Promise<SaleAccountConfig> {
    const doc = await SaleAccountMappingModel.findOne({ companyId }).lean()

    if (!doc) {
      throw new Error(`SaleAccountMapping not found for companyId "${companyId}"`)
    }

    return mongoToSaleAccountConfig(doc)
  }

  async save(mapping: SaleAccountConfig): Promise<void> {
    await SaleAccountMappingModel.updateOne({ companyId: mapping.companyId }, mapping, { upsert: true })
  }
}
