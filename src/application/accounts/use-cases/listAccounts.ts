import type { AccountRepository } from '@application/shared/ports/AccountRepository'

type Dependencies = {
  accountRepository: AccountRepository
}

export const makeListAccounts = ({ accountRepository }: Dependencies) => ({
  execute: async (companyId: string) => {
    const accounts = await accountRepository.getAll()
    return accounts.map((account) => ({
      code: account.code,
      name: account.name,
      type: account.type,
      nature: account.nature,
      balance: account.currentBalanceByCompany?.[companyId] ?? 0,
    }))
  },
})
