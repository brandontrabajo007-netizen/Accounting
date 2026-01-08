import type { Customer } from '../../domain/Customer'
import { normalizeCustomerName } from '../../domain/normalizeCustomerName'
import type { CustomerRepository } from '../ports/CustomerRepository'

export const ensureCustomer = async (customerRepository: CustomerRepository, companyId: string, name: string): Promise<Customer> => {
  const normalizedName = normalizeCustomerName(name)
  const existing = await customerRepository.findByNormalizedName(companyId, normalizedName)
  if (existing) return existing

  return customerRepository.create({
    companyId,
    name: name.trim(),
    normalizedName,
  })
}
