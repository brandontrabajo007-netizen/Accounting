import { ensurePeriodIsOpen } from '@domain/accounting-periods/PeriodMustBeOpenPolicy'
import type { AccountingPeriodRepository } from '../ports/AccountingPeriodRepository'

export type ResolvePeriodId = {
  resolve: (companyId: string, provided?: string | null) => Promise<string>
}

export const makeResolvePeriodId = (periodRepo: AccountingPeriodRepository): ResolvePeriodId => ({
  resolve: async (companyId, provided) => {
    if (!companyId) throw new Error('companyId is required')

    if (provided) {
      const period = await periodRepo.findById(provided)
      if (!period || period.companyId !== companyId) throw new Error('Accounting period not found')
      ensurePeriodIsOpen(period)
      return period.id
    }

    const open = await periodRepo.findOpenByCompany(companyId)
    if (open.length === 0) throw new Error('No open accounting period for company')
    if (open.length > 1) throw new Error('Multiple open accounting periods; specify periodId')

    ensurePeriodIsOpen(open[0])
    return open[0].id
  },
})
