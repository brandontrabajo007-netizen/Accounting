import type { ApEntry } from '../../domain/ApEntry'

export interface ApSupplierBalance {
  supplierId: string
  balance: number
}

export interface ApEntryRepository {
  add(entry: Omit<ApEntry, 'id' | 'createdAt'>): Promise<ApEntry>
  listBySupplier(companyId: string, supplierId: string): Promise<ApEntry[]>
  listBalancesByCompany(companyId: string): Promise<ApSupplierBalance[]>
  getBalanceBySupplier(companyId: string, supplierId: string): Promise<number>
}
