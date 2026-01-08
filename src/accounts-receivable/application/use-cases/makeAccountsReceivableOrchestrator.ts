import type { AccountsReceivableSettingsRepository } from '../ports/AccountsReceivableSettingsRepository'
import type { ArEntryRepository } from '../ports/ArEntryRepository'
import type { CustomerRepository } from '../ports/CustomerRepository'
import { makeRegisterCustomerDebt } from './registerCustomerDebt'
import { makeRegisterCustomerPayment } from './registerCustomerPayment'

export interface RegisterSaleArInput {
  companyId: string
  customerName?: string | null
  amount: number
  date?: Date
  journalEntryId?: string
  description?: string
  paymentMethod?: string | null
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const isCreditSale = (paymentMethod: string | null | undefined, defaultCredit: boolean) => {
  if (!paymentMethod) return false
  const normalized = normalize(paymentMethod)
  if (/(credito|a credito|al credito)/.test(normalized)) return true
  if (/(efectivo|transferencia|banco|tarjeta|nequi|daviplata)/.test(normalized)) return false
  return defaultCredit
}

export const makeAccountsReceivableOrchestrator = (deps: {
  customerRepository: CustomerRepository
  arEntryRepository: ArEntryRepository
  settingsRepository: AccountsReceivableSettingsRepository
}) => {
  const { registerCustomerDebt } = makeRegisterCustomerDebt({
    customerRepository: deps.customerRepository,
    arEntryRepository: deps.arEntryRepository,
  })
  const { registerCustomerPayment } = makeRegisterCustomerPayment({
    customerRepository: deps.customerRepository,
    arEntryRepository: deps.arEntryRepository,
  })

  const isEnabled = async (companyId: string) => {
    const settings = await deps.settingsRepository.getByCompanyId(companyId)
    return settings?.enabled ?? false
  }

  const registerSaleIfNeeded = async (input: RegisterSaleArInput) => {
    if (!input.customerName?.trim()) return null
    const settings = await deps.settingsRepository.getByCompanyId(input.companyId)
    if (!settings?.enabled) return null

    const shouldCreateDebt = isCreditSale(input.paymentMethod ?? null, settings.defaultCreditWhenMissingPaymentMethod)
    if (!shouldCreateDebt) return null

    return registerCustomerDebt({
      companyId: input.companyId,
      customerName: input.customerName,
      amount: input.amount,
      date: input.date,
      source: {
        referenceId: input.journalEntryId,
        note: input.description,
      },
    })
  }

  const registerCustomerPaymentIfNeeded = async (input: {
    companyId: string
    customerName?: string | null
    amount: number
    date?: Date
    journalEntryId?: string
    description?: string
    paymentMethod?: string | null
  }) => {
    if (!input.customerName?.trim()) return null
    const settings = await deps.settingsRepository.getByCompanyId(input.companyId)
    if (!settings?.enabled) return null

    return registerCustomerPayment({
      companyId: input.companyId,
      customerName: input.customerName,
      amount: input.amount,
      date: input.date,
      source: {
        referenceId: input.journalEntryId,
        note: input.paymentMethod ?? input.description,
      },
    })
  }

  return { registerSaleIfNeeded, registerCustomerPaymentIfNeeded, isEnabled }
}
