import type { Supplier } from '../../domain/Supplier'

export interface SupplierRepository {
  findById(id: string): Promise<Supplier | null>
  findByNormalizedName(companyId: string, normalizedName: string): Promise<Supplier | null>
  findByIds(ids: string[]): Promise<Supplier[]>
  listByCompany(
    companyId: string,
    params?: { search?: string; page?: number; limit?: number },
  ): Promise<{ items: Supplier[]; total: number }>
  create(data: { companyId: string; name: string; normalizedName: string }): Promise<Supplier>
}
