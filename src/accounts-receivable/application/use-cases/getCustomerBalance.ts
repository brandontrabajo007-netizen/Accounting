import { normalizeCustomerName } from '../../domain/normalizeCustomerName'
import type { ArEntryRepository } from '../ports/ArEntryRepository'
import type { CustomerRepository } from '../ports/CustomerRepository'

export const makeGetCustomerBalance = (deps: { customerRepository: CustomerRepository; arEntryRepository: ArEntryRepository }) => {
  const getCustomerBalance = async (input: { companyId: string; customerName: string }) => {
    const normalized = normalizeCustomerName(input.customerName)
    const customer = await deps.customerRepository.findByNormalizedName(input.companyId, normalized)
    if (!customer) return null

    const balance = await deps.arEntryRepository.getBalanceByCustomer(input.companyId, customer.id)
    return { customer, balance }
  }

  return { getCustomerBalance }
}
