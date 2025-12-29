import { AccountingPeriodStatus } from '@domain/accounting-periods/AccountingPeriodStatus'
import { ensurePeriodIsOpen } from '@domain/accounting-periods/PeriodMustBeOpenPolicy'
import type { AccountingPeriodRepository } from '../ports/AccountingPeriodRepository'

type Dependencies = {
  accountingPeriodRepository: AccountingPeriodRepository
}

export const makeOpenAccountingPeriod = ({ accountingPeriodRepository }: Dependencies) => ({
  execute: async (companyId: string, periodId: string) => {
    const period = await accountingPeriodRepository.findById(periodId)
    if (!period || period.companyId !== companyId) {
      throw new Error('Accounting period not found')
    }

    // permitir reabrir CLOSED o abrir CREATED
    if (period.status !== AccountingPeriodStatus.CREATED && period.status !== AccountingPeriodStatus.CLOSED) {
      // ya está open
      ensurePeriodIsOpen(period)
      return period
    }

    await accountingPeriodRepository.markOpenExclusive(companyId, periodId)

    const updated = await accountingPeriodRepository.findById(periodId)
    return updated ?? period
  },
})
