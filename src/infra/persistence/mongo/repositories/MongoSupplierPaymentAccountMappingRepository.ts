import type { SupplierPaymentAccountMappingRepository } from '@application/eventos/supplier-payments/ports/SupplierPaymentAccountMappingRepository'
import type { SupplierPaymentAccountConfig } from '@domain/events/supplier-payment/SupplierPaymentAccountConfig'
import { mongoToSupplierPaymentAccountConfig } from '../mappers/supplierPaymentAccountMapping.mapper'
import { SupplierPaymentAccountMappingModel } from '../models/supplierPaymentAccountMapping.model'

export class MongoSupplierPaymentAccountMappingRepository implements SupplierPaymentAccountMappingRepository {
  async getSupplierPaymentAccountMappingByCompanyId(companyId: string): Promise<SupplierPaymentAccountConfig> {
    const doc = await SupplierPaymentAccountMappingModel.findOne({ companyId }).lean()

    if (!doc) {
      throw new Error(`SupplierPaymentAccountMapping not found for companyId "${companyId}"`)
    }

    return mongoToSupplierPaymentAccountConfig(doc)
  }

  async save(mapping: SupplierPaymentAccountConfig): Promise<void> {
    await SupplierPaymentAccountMappingModel.updateOne({ companyId: mapping.companyId }, mapping, { upsert: true })
  }
}
