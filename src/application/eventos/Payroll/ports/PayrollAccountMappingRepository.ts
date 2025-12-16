// src/application/Payroll/ports/PayrollAccountMappingRepository.ts
import type { PayrollAccountConfig } from '@domain/events/payroll/PayrollAccountConfig'

export interface PayrollAccountMappingRepository {
  getPayrollAccountMappingByCompanyId(companyId: string): Promise<PayrollAccountConfig>
}
