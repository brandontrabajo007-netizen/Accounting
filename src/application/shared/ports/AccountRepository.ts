// src/application/ports/AccountRepository.ts

import type { Account } from '@domain/accounts/Account'

export interface AccountRepository {
  getAll(): Promise<Account[]>
  getByCode(code: number): Promise<Account>
  getBalance(companyId: string, accountCode: number): Promise<number>
  applyBalanceDelta(companyId: string, accountCode: number, delta: number): Promise<void>
}
