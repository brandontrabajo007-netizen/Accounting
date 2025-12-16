// src/application/ports/AccountRepository.ts

import type { Account } from '@domain/accounts/Account'

export interface AccountRepository {
  getAll(): Promise<Account[]>
  getByCode(code: number): Promise<Account>
  updateBalance(accountCode: number, newBalance: number): Promise<void>
}
