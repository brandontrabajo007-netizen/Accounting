import type { CustomerHistoryEntry } from '../../domain/CustomerHistoryEntry'

export interface CustomerHistoryRepository {
  add(entry: Omit<CustomerHistoryEntry, 'id' | 'createdAt'>): Promise<CustomerHistoryEntry>
  listByCustomer(
    companyId: string,
    customerId: string,
    params?: { from?: Date; to?: Date; page?: number; limit?: number; sort?: 'asc' | 'desc' },
  ): Promise<{ items: CustomerHistoryEntry[]; total: number }>
  deleteByCustomer(companyId: string, customerId: string): Promise<number>
}
