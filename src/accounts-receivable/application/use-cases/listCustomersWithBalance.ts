import type { ArEntryRepository } from '../ports/ArEntryRepository'
import type { CustomerRepository } from '../ports/CustomerRepository'

export const makeListCustomersWithBalance = (deps: { customerRepository: CustomerRepository; arEntryRepository: ArEntryRepository }) => {
  const listCustomersWithBalance = async (input: { companyId: string }) => {
    const balances = await deps.arEntryRepository.listBalancesByCompany(input.companyId)
    const positive = balances.filter((item) => item.balance !== 0)
    if (positive.length === 0) return []

    const customers = await deps.customerRepository.findByIds(positive.map((item) => item.customerId))
    const customerMap = new Map(customers.map((customer) => [customer.id, customer]))

    return positive
      .map((item) => {
        const customer = customerMap.get(item.customerId)
        if (!customer) return null
        return {
          customer,
          balance: item.balance,
        }
      })
      .filter((item): item is { customer: typeof customers[number]; balance: number } => Boolean(item))
  }

  return { listCustomersWithBalance }
}
