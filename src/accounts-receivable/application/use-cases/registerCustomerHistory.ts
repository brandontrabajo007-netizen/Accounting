import type { CustomerHistoryEntry } from '../../domain/CustomerHistoryEntry'
import type { CustomerHistoryRepository } from '../ports/CustomerHistoryRepository'
import type { CustomerRepository } from '../ports/CustomerRepository'
import { ensureCustomer } from '../services/ensureCustomer'

export interface RegisterCustomerHistorySaleInput {
  companyId: string
  customerName: string
  amount: number
  date?: Date
  description?: string
  paymentMethod?: string | null
  journalEntryId?: string
}

export interface RegisterCustomerHistoryPaymentInput {
  companyId: string
  customerName: string
  amount: number
  date?: Date
  description?: string
  paymentMethod?: string | null
  journalEntryId?: string
}

export const makeRegisterCustomerHistory = (deps: { customerRepository: CustomerRepository; customerHistoryRepository: CustomerHistoryRepository }) => {
  const registerSaleHistory = async (input: RegisterCustomerHistorySaleInput): Promise<CustomerHistoryEntry | null> => {
    if (!input.customerName?.trim()) return null
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null

    const customer = await ensureCustomer(deps.customerRepository, input.companyId, input.customerName)

    return deps.customerHistoryRepository.add({
      companyId: input.companyId,
      customerId: customer.id,
      type: 'sale',
      amount: input.amount,
      date: input.date ?? new Date(),
      description: input.description,
      paymentMethod: input.paymentMethod ?? undefined,
      journalEntryId: input.journalEntryId,
    })
  }

  const registerPaymentHistory = async (input: RegisterCustomerHistoryPaymentInput): Promise<CustomerHistoryEntry | null> => {
    if (!input.customerName?.trim()) return null
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null

    const customer = await ensureCustomer(deps.customerRepository, input.companyId, input.customerName)

    return deps.customerHistoryRepository.add({
      companyId: input.companyId,
      customerId: customer.id,
      type: 'payment',
      amount: input.amount,
      date: input.date ?? new Date(),
      description: input.description,
      paymentMethod: input.paymentMethod ?? undefined,
      journalEntryId: input.journalEntryId,
    })
  }

  return { registerSaleHistory, registerPaymentHistory }
}
