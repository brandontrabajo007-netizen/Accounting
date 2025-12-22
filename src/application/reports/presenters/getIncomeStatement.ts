import type { Account } from '@domain/accounts/Account'
import type { AccountDetail } from './AccountDetail'
import type { IncomeStatementResult } from './IncomeStatementResult'

type IncomeSection = 'Sales Revenue' | 'Cost of Goods Sold' | 'Operating Expenses' | null

export const getIncomeStatement = (accounts: Account[], companyId: string, period: { start: string; end: string }): IncomeStatementResult => {
  const result: IncomeStatementResult = {
    name: 'Income Statement',
    description: `Periodo ${period.start} - ${period.end}`,
    period: {
      start: period.start,
      end: period.end,
    },
    sections: [
      { name: 'Sales Revenue', accounts: [], total: 0 },
      { name: 'Cost of Goods Sold', accounts: [], total: 0 },
      { name: 'Operating Expenses', accounts: [], total: 0 },
    ],
    totals: {
      grossProfit: 0,
      operatingIncome: 0,
      incomeBeforeTaxes: 0,
    },
    generatedAt: new Date().toISOString(),
  }

  const sectionMaps = new Map<IncomeSection, Map<number, AccountDetail>>([
    ['Sales Revenue', new Map()],
    ['Cost of Goods Sold', new Map()],
    ['Operating Expenses', new Map()],
  ])

  for (const account of accounts) {
    const balance = account.currentBalanceByCompany?.[companyId] ?? 0
    if (balance === 0) continue

    const sectionName = classifyAccount(account.code)
    if (!sectionName) continue

    const sectionMap = sectionMaps.get(sectionName)
    if (!sectionMap) continue

    sectionMap.set(account.code, {
      code: account.code,
      name: account.name,
      total: balance,
    })
  }

  for (const section of result.sections) {
    const map = sectionMaps.get(section.name as IncomeSection)
    if (!map) continue

    section.accounts = Array.from(map.values())
    section.total = section.accounts.reduce((sum, acc) => sum + acc.total, 0)
  }

  const revenue = result.sections[0].total
  const cogs = result.sections[1].total
  const operatingExpenses = result.sections[2].total

  result.totals.grossProfit = revenue - cogs
  result.totals.operatingIncome = revenue - cogs - operatingExpenses
  result.totals.incomeBeforeTaxes = result.totals.operatingIncome

  return result
}

const classifyAccount = (code: number): IncomeSection => {
  if (code >= 4100 && code < 4200) return 'Sales Revenue'
  if (code >= 6100 && code < 6200) return 'Cost of Goods Sold'
  if (code >= 5100 && code < 5400) return 'Operating Expenses'
  return null
}
