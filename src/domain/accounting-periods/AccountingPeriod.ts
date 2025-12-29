import type { AccountingPeriodStatus } from './AccountingPeriodStatus'

export type AccountingPeriod = {
  id: string
  companyId: string
  name?: string
  start: Date
  end: Date
  status: AccountingPeriodStatus
}
