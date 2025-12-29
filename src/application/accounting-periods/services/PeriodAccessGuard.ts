import type { AccountingPeriodRepository } from '../ports/AccountingPeriodRepository'
import { ensurePeriodIsOpen } from '@domain/accounting-periods/PeriodMustBeOpenPolicy'

export type PeriodAccessGuard = {
  assertWritable: (companyId: string, periodId: string | null | undefined) => Promise<void>
}

export const makePeriodAccessGuard = (periodRepo: AccountingPeriodRepository): PeriodAccessGuard => ({
  assertWritable: async (companyId, periodId) => {
    if (!periodId) return
    const period = await periodRepo.findById(periodId)
    if (!period || period.companyId !== companyId) {
      throw new Error('Accounting period not found')
    }
    ensurePeriodIsOpen(period)
  },
})
