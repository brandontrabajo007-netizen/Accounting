import type { CustomerPaymentAccountMappingRepository } from '@application/eventos/customer-payments/ports/CustomerPaymentAccountMappingRepository'
import type { CustomerPaymentAccountConfig } from '@domain/events/customer-payment/CustomerPaymentAccountConfig'
import { mongoToCustomerPaymentAccountConfig } from '../mappers/customerPaymentAccountMapping.mapper'
import { CustomerPaymentAccountMappingModel } from '../models/customerPaymentAccountMapping.model'

export class MongoCustomerPaymentAccountMappingRepository implements CustomerPaymentAccountMappingRepository {
  async getCustomerPaymentAccountMappingByCompanyId(companyId: string): Promise<CustomerPaymentAccountConfig> {
    const doc = await CustomerPaymentAccountMappingModel.findOne({ companyId }).lean()

    if (!doc) {
      throw new Error(`CustomerPaymentAccountMapping not found for companyId "${companyId}"`)
    }

    return mongoToCustomerPaymentAccountConfig(doc)
  }

  async save(mapping: CustomerPaymentAccountConfig): Promise<void> {
    await CustomerPaymentAccountMappingModel.updateOne({ companyId: mapping.companyId }, mapping, { upsert: true })
  }
}
