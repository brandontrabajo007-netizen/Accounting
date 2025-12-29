import type { PeriodResult } from '@domain/accounting-periods/snapshots/PeriodResult'

export type PeriodResultRepository = {
  save: (snapshot: PeriodResult) => Promise<void>
  findByPeriod: (companyId: string, periodId: string) => Promise<PeriodResult | null>
}
