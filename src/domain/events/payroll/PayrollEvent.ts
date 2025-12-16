// src/domain/events/payroll/PayrollEvent.ts
import type { AccountingEvent } from '../AccountingEvent'
import type { PayrollAccountConfig } from './PayrollAccountConfig'

export interface PayrollEvent extends AccountingEvent<PayrollAccountConfig> {
  companyId: string
  description: string
  amount: number
  paymentMethod: 'cash' | 'bank' // nómina siempre paga de contado
  date: Date
  beneficiary?: string // tintorería, taller, empleado, etc.
}
