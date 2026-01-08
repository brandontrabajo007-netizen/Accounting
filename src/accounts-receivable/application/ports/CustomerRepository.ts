import type { Customer } from '../../domain/Customer'

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>
  findByNormalizedName(companyId: string, normalizedName: string): Promise<Customer | null>
  findByIds(ids: string[]): Promise<Customer[]>
  listByCompany(
    companyId: string,
    params?: { search?: string; page?: number; limit?: number },
  ): Promise<{ items: Customer[]; total: number }>
  create(data: { companyId: string; name: string; normalizedName: string }): Promise<Customer>
}
