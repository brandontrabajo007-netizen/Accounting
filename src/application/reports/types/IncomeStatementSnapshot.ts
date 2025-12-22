export type IncomeStatementSnapshot = {
  id: string
  companyId: string

  period: {
    start: string
    end: string
  }

  sections: {
    name: string
    total: number
    accounts: {
      code: number
      name: string
      total: number
    }[]
  }[]

  totals: {
    grossProfit: number
    operatingIncome: number
    incomeBeforeTaxes: number
    netIncome?: number
  }

  generatedAt: Date
}
