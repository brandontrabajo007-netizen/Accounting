import type { IncomeStatementSection } from './IncomeStatementSection'

export type IncomeStatementResult = {
  name: string
  description: string
  period: {
    start: string
    end: string
  }
  sections: IncomeStatementSection[]
  totals: {
    grossProfit: number
    operatingIncome: number
    incomeBeforeTaxes: number
  }
  generatedAt: string
}
