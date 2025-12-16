import type { Account } from '@domain/accounts/Account'
import type { AccountDocument } from '../models/account.model'

export const mongoToAccount = (doc: AccountDocument): Account => ({
  code: doc.code,
  name: doc.name,
  type: doc.type as Account['type'],
  nature: doc.nature as Account['nature'],
  currentBalanceByCompany: Object.fromEntries(doc.currentBalanceByCompany ?? []),
})

export const accountToMongo = (account: Account) => ({
  code: account.code,
  name: account.name,
  type: account.type,
  nature: account.nature,
  currentBalanceByCompany: new Map(Object.entries(account.currentBalanceByCompany)),
})
