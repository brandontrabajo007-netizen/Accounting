import { makePeriodClosedError } from './errors/PeriodClosedError'
import type { AccountingPeriod } from './AccountingPeriod'
import { AccountingPeriodStatus } from './AccountingPeriodStatus'

export const ensurePeriodIsOpen = (period: AccountingPeriod | null | undefined) => {
  if (!period) return
  if (period.status === AccountingPeriodStatus.CLOSED) {
    throw makePeriodClosedError(period.id)
  }
}
