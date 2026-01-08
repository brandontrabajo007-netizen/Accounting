import type { SupplierHistoryEntry } from '../../domain/SupplierHistoryEntry'

export interface SupplierHistoryRepository {
  add(entry: Omit<SupplierHistoryEntry, 'id' | 'createdAt'>): Promise<SupplierHistoryEntry>
  listBySupplier(
    companyId: string,
    supplierId: string,
    params?: { from?: Date; to?: Date; page?: number; limit?: number; sort?: 'asc' | 'desc' },
  ): Promise<{ items: SupplierHistoryEntry[]; total: number }>
}
