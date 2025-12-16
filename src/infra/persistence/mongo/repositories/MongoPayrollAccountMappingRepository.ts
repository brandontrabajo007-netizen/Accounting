import type { PayrollAccountMappingRepository } from '@application/eventos/Payroll/ports/PayrollAccountMappingRepository'
import { toPayrollAccountConfig } from '../mappers/payrollAccountMapping.mapper'
import { PayrollAccountMappingModel } from '../models/PayrollAccountMapping.model'

export class MongoPayrollAccountMappingRepository implements PayrollAccountMappingRepository {
  async getPayrollAccountMappingByCompanyId(companyId: string) {
    const doc = await PayrollAccountMappingModel.findOne({ companyId })

    if (!doc) {
      throw new Error(`❌ PayrollAccountMapping no encontrado para companyId: ${companyId}`)
    }

    return toPayrollAccountConfig(doc)
  }
}
