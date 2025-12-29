import type { AccountingPeriodRepository } from '../ports/AccountingPeriodRepository'

type Dependencies = {
  accountingPeriodRepository: AccountingPeriodRepository
}

export const makeListAccountingPeriods = ({ accountingPeriodRepository }: Dependencies) => ({
  execute: async (companyId: string) => {
    return accountingPeriodRepository.findByCompany(companyId)
  },
})
