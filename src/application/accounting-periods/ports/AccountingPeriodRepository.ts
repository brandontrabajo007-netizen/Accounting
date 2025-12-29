import type { AccountingPeriod } from '@domain/accounting-periods/AccountingPeriod'

export type AccountingPeriodRepository = {
  findById: (id: string) => Promise<AccountingPeriod | null>
  findByDate: (companyId: string, date: Date) => Promise<AccountingPeriod | null>
  findOpenByCompany: (companyId: string) => Promise<AccountingPeriod[]>
  findByCompany: (companyId: string) => Promise<AccountingPeriod[]>
  save: (period: AccountingPeriod) => Promise<void>
  markClosed: (periodId: string) => Promise<void>
  markOpenExclusive: (companyId: string, periodId: string) => Promise<void>
  lockById: (periodId: string) => Promise<AccountingPeriod | null>
}
