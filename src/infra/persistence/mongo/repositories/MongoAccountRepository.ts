import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { Account } from '@domain/accounts/Account'
import { mongoToAccount } from '../mappers/account.mapper'
import { AccountModel } from '../models/account.model'

export class MongoAccountRepository implements AccountRepository {
  async getAll(): Promise<Account[]> {
    const docs = await AccountModel.find()
    return docs.map(mongoToAccount)
  }

  async getByCode(code: number): Promise<Account> {
    const doc = await AccountModel.findOne({ code })

    if (!doc) {
      throw new Error(`Account ${code} not found`)
    }
    return mongoToAccount(doc)
  }

  async updateBalance(accountCode: number, newBalance: number): Promise<void> {
    const updated = await AccountModel.updateOne({ code: accountCode }, { $set: { currentBalance: newBalance } })

    if (updated.matchedCount === 0) {
      throw new Error(`Cannot update balance: account ${accountCode} not found`)
    }
  }
}
