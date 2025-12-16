import type { AccountDetail } from './AccountDetail'

export type IncomeStatementSection = {
  name: string
  accounts: AccountDetail[]
  total: number
}
