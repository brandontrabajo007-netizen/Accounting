import type { ArEntry } from '../../domain/ArEntry'

export interface ArCustomerBalance {
  customerId: string
  balance: number
}

export interface ArEntryRepository {
  add(entry: Omit<ArEntry, 'id' | 'createdAt'>): Promise<ArEntry>
  listByCustomer(companyId: string, customerId: string): Promise<ArEntry[]>
  listBalancesByCompany(companyId: string): Promise<ArCustomerBalance[]>
  getBalanceByCustomer(companyId: string, customerId: string): Promise<number>
  deleteByCustomer(companyId: string, customerId: string): Promise<number>
}
