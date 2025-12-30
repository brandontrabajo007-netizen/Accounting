import type { PayrollEventInput } from '@application/eventos/Payroll/data/PayrollEventInput'
import type { PurchaseEventInput } from '@application/eventos/Purchase/data/PurchaseEventInput'
import type { SaleEventInput } from '@application/eventos/sales/data/SaleEventInput'

// -----------------------------------------------------------------------------
// TIPOS DE TELEGRAM BÁSICOS
// -----------------------------------------------------------------------------
export interface TelegramUser {
  id: number
  first_name?: string
  username?: string
}

export interface TelegramChat {
  id: number
  type: string
}

export interface TelegramVoice {
  file_id: string
  file_unique_id: string
  duration: number
  mime_type?: string
}

export interface TelegramAudio {
  file_id: string
  file_unique_id: string
  duration: number
  mime_type?: string
  file_name?: string
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
  voice?: TelegramVoice
  audio?: TelegramAudio
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

// -----------------------------------------------------------------------------
// TIPOS DE PARSED EVENTS
// -----------------------------------------------------------------------------
export interface ParsedTelegramSale {
  chatId: number
  saleInput: SaleEventInput
}

export interface ParsedTelegramPurchase {
  chatId: number
  purchaseInput: PurchaseEventInput
}

export interface ParsedTelegramPayroll {
  chatId: number
  payrollInput: PayrollEventInput
}

export interface ParsedIncomeStatementQuery {
  chatId: number
  companyId: string
  period: { start: string; end: string }
}

// -----------------------------------------------------------------------------
// RESULTADO UNIFICADO DEL DETECTOR DE EVENTOS
// -----------------------------------------------------------------------------
export type DetectedEvent =
  | { type: 'sale'; chatId: number; data: SaleEventInput }
  | { type: 'sale_error'; chatId: number }
  | { type: 'purchase'; chatId: number; data: PurchaseEventInput }
  | { type: 'purchase_error'; chatId: number }
  | { type: 'payroll'; chatId: number; data: PayrollEventInput }
  | { type: 'payroll_error'; chatId: number }
  | { type: 'income_statement_query'; chatId: number; companyId: string; period: { start: string; end: string } }
  | { type: 'income_statement_error'; chatId: number }
  | { type: 'unknown'; chatId: number }
