import { AccountingPeriodStatus } from '@domain/accounting-periods/AccountingPeriodStatus'
import type { AccountingPeriodRepository } from '../ports/AccountingPeriodRepository'

type Dependencies = {
  accountingPeriodRepository: AccountingPeriodRepository
}

type Input = {
  companyId: string
  startDate: string
  endDate: string
  name?: string
}

export const makeCreateAccountingPeriod = ({ accountingPeriodRepository }: Dependencies) => ({
  execute: async ({ companyId, startDate, endDate, name }: Input) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('startDate y endDate deben ser fechas válidas')
    }
    if (end < start) {
      throw new Error('endDate no puede ser anterior a startDate')
    }

    const existing = await accountingPeriodRepository.findByCompany(companyId)
    const overlaps = existing.find(
      (p) =>
        // solape si inician antes del fin y terminan después del inicio
        p.start <= end && p.end >= start,
    )
    if (overlaps) {
      throw new Error('El período se solapa con uno existente')
    }

    const period = {
      id: undefined as unknown as string,
      companyId,
      name,
      start,
      end,
      status: AccountingPeriodStatus.CREATED,
    }

    await accountingPeriodRepository.save(period)

    return period
  },
})
