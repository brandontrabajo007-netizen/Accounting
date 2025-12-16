// src/domain/events/payroll/PayrollAccountConfig.ts
import type { BaseAccountMapping } from '../../accounts/BaseAccountMapping'

export interface PayrollAccountConfig extends BaseAccountMapping {
  expenseAccount: number // ej. 5105 - Gastos de personal / nómina
  cashAccount: number // 1105 - Caja general
  bankAccount: number // 1110 - Bancos
}
