import { makeGetCustomerBalance } from '@accounts-receivable/application/use-cases/getCustomerBalance'
import { makeGetCustomerStatement } from '@accounts-receivable/application/use-cases/getCustomerStatement'
import { makeListCustomersWithBalance } from '@accounts-receivable/application/use-cases/listCustomersWithBalance'
import type { Customer } from '@accounts-receivable/domain/Customer'
import type { Supplier } from '@accounts-payable/domain/Supplier'
import { makeGetSupplierBalance } from '@accounts-payable/application/use-cases/getSupplierBalance'
import { makeGetSupplierStatement } from '@accounts-payable/application/use-cases/getSupplierStatement'
import { makeListSuppliersWithBalance } from '@accounts-payable/application/use-cases/listSuppliersWithBalance'
import { makeRegisterCustomerPayment } from '@application/eventos/customer-payments/use-cases/registerCustomerPayment'
import { makeRegisterSupplierPayment } from '@application/eventos/supplier-payments/use-cases/registerSupplierPayment'
import type { PayrollEventInput } from '@application/eventos/Payroll/data/PayrollEventInput'
import { makeRegisterPayroll } from '@application/eventos/Payroll/use-case/registerPayroll'
import type { PurchaseEventInput } from '@application/eventos/Purchase/data/PurchaseEventInput'
import { makeRegisterPurchase } from '@application/eventos/Purchase/use-cases/registerPurchase'
import type { SaleEventInput } from '@application/eventos/sales/data/SaleEventInput'
import { makeRegisterSale } from '@application/eventos/sales/use-cases/registerSale'
import type { PendingEvent, PendingEventStatus, PendingEventType } from '@application/pending-events/PendingEvent'
import { makeGenerateIncomeStatement } from '@application/reports/use-cases/generateIncomeStatement'
import { AccountingPeriodStatus } from '@domain/accounting-periods/AccountingPeriodStatus'
import type { Movement } from '@domain/movements'
import { TelegramAdapter } from '@infra/telegram/telegramAdapter'
import { TelegramClient } from '@infra/telegram/telegramClient'
import express, { type Request, type Response } from 'express'
import {
  accountingPeriodRepository,
  accountRepository,
  accountsPayableOrchestrator,
  accountsReceivableOrchestrator,
  apSupplierRepository,
  arCustomerRepository,
  arEntryRepository,
  arSettingsRepository,
  apEntryRepository,
  apSettingsRepository,
  customerHistoryRepository,
  customerHistoryService,
  customerPaymentAccountMappingRepository,
  journalEntryRepository,
  payrollAccountMappingRepository,
  pendingEventRepository,
  periodAccessGuard,
  processJournalEntry,
  purchaseAccountMappingRepository,
  resolvePeriodId,
  saleAccountMappingRepository,
  supplierHistoryRepository,
  supplierHistoryService,
  supplierPaymentAccountMappingRepository,
  userRepository,
} from '../dependencies'

const router = express.Router()

const { registerSale } = makeRegisterSale({
  accountRepository,
  journalEntryRepository,
  saleAccountMappingRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
  accountsReceivable: accountsReceivableOrchestrator,
  customerHistory: customerHistoryService,
})

const { registerPurchase } = makeRegisterPurchase({
  accountRepository,
  journalEntryRepository,
  purchaseAccountMappingRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
  accountsPayable: accountsPayableOrchestrator,
  supplierHistory: supplierHistoryService,
})

const { registerPayroll } = makeRegisterPayroll({
  accountRepository,
  journalEntryRepository,
  payrollAccountMappingRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
})

const { generateIncomeStatement } = makeGenerateIncomeStatement({
  accountRepository,
  journalEntryRepository,
})

const { registerCustomerPayment } = makeRegisterCustomerPayment({
  accountRepository,
  customerPaymentAccountMappingRepository,
  journalEntryRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
  accountsReceivable: accountsReceivableOrchestrator,
  customerHistory: customerHistoryService,
})

const { registerSupplierPayment } = makeRegisterSupplierPayment({
  accountRepository,
  supplierPaymentAccountMappingRepository,
  journalEntryRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
  accountsPayable: accountsPayableOrchestrator,
  supplierHistory: supplierHistoryService,
})

const { getCustomerBalance } = makeGetCustomerBalance({
  customerRepository: arCustomerRepository,
  arEntryRepository,
})

const { listCustomersWithBalance } = makeListCustomersWithBalance({
  customerRepository: arCustomerRepository,
  arEntryRepository,
})

const { getCustomerStatement } = makeGetCustomerStatement({
  customerRepository: arCustomerRepository,
  arEntryRepository,
  customerHistoryRepository,
})

const { getSupplierBalance } = makeGetSupplierBalance({
  supplierRepository: apSupplierRepository,
  apEntryRepository,
})

const { listSuppliersWithBalance } = makeListSuppliersWithBalance({
  supplierRepository: apSupplierRepository,
  apEntryRepository,
})

const { getSupplierStatement } = makeGetSupplierStatement({
  supplierRepository: apSupplierRepository,
  apEntryRepository,
  supplierHistoryRepository,
})

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const looksLikeAccountingEvent = (value: string) => {
  const text = normalizeText(value)
  return /\b(vendi|vendio|venta|compre|compra|pague|pago|nomina|salario|ingreso|estado de resultados|utilidad|ganancia|perdi|perdida|debe|cobrar|extracto)\b/.test(text)
}

const isGreetingOrHelp = (value: string) => {
  const text = normalizeText(value)
  if (looksLikeAccountingEvent(text)) return false
  const greeting = /\b(hola|buenas|buenos dias|buenas tardes|buenas noches|hey)\b/.test(text)
  const help = /\b(que puedes hacer|como te uso|como funciona|ayuda|help|no entiendo|no entendi|no se|no se que hacer)\b/.test(text)
  return greeting || help
}

const helpMessage = `
👋 ¡Hola! Soy tu asistente contable 🤖

Con mis superpoderes puedo:
📊 Registrar ventas, compras y pagos de nómina
💰 Consultar tu utilidad al instante (hoy, esta semana, este mes, este año)

*¿Cómo me usas?* 

💵 *Venta:*
"Vendí 10 pantalones a 50.000 me cuesta 36.000"

📦 *Compra:*
"Compré tela por 700.000 sin IVA en efectivo"

👥 *Nómina:*
"Pagué nómina 500000 por banco"

¡Cuéntame qué vendiste, compraste o pagaste! 🚀
`.trim()

const formatHelpMessage = (name?: string) => {
  const trimmed = name?.trim()
  if (!trimmed) return helpMessage
  return helpMessage.replace('Hola!', `Hola ${trimmed}!`)
}

function ensureChatId(chatId: number | null, res: Response): chatId is number {
  if (!chatId) {
    console.error('No chatId found, no puedo enviar respuesta')
    res.status(200).json({ ok: true })
    return false
  }
  return true
}

const formatDate = (value: string | number | Date | null | undefined) => {
  if (value === null || value === undefined) return 'sin fecha'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? 'sin fecha' : d.toISOString().slice(0, 10)
}

const formatCurrency = (value: number) =>
  value.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })

const PENDING_EXPIRATION_MINUTES = 10
const CALLBACK_PREFIX = 'p'
const CALLBACK_ACTIONS = {
  confirm: 'c',
  confirmCustomer: 'cc',
  confirmNew: 'cn',
  confirmSupplier: 'cs',
  confirmNewSupplier: 'cns',
  cancel: 'x',
} as const

const buildCallbackData = (pendingId: string, action: string, entityId?: string) => [CALLBACK_PREFIX, pendingId, action, entityId].filter(Boolean).join('|')

const parseCallbackData = (data?: string) => {
  if (!data) return null
  const [prefix, pendingId, action, entityId] = data.split('|')
  if (prefix !== CALLBACK_PREFIX || !pendingId || !action) return null
  return { pendingId, action, entityId }
}

const formatOptionalText = (value?: string | null) => (value?.trim() ? value.trim() : 'sin dato')
const formatOptionalCurrency = (value?: number | null) => (Number.isFinite(value) ? formatCurrency(value as number) : 'sin dato')
const formatOptionalDate = (value?: string | null) => (value ? formatDate(value) : 'sin fecha')

const isCustomerBasedEvent = (eventType: PendingEventType) => eventType === 'sale' || eventType === 'customer_payment'
const isSupplierBasedEvent = (eventType: PendingEventType) => eventType === 'purchase' || eventType === 'supplier_payment'

const resolveDefaultDate = (date?: string | null, periodHint?: string | null) => {
  if (date) return date
  if (periodHint) {
    const [year, month] = periodHint.split('-').map((v) => Number(v))
    if (year && month && month >= 1 && month <= 12) {
      return new Date(Date.UTC(year, month - 1, 1)).toISOString()
    }
  }
  return new Date().toISOString()
}

const resolveSalePreview = (sale: SaleEventInput) => {
  let quantity = sale.quantity ?? 0
  let unitPrice = sale.unitPrice ?? null
  let totalAmount = sale.totalAmount ?? null

  if (unitPrice != null && quantity > 0 && totalAmount == null) {
    totalAmount = quantity * unitPrice
  }
  if (totalAmount != null && quantity > 0 && unitPrice == null) {
    unitPrice = Math.round(totalAmount / quantity)
  }

  const date = resolveDefaultDate(sale.date ?? null, sale.periodHint ?? null)

  const paymentMethod = sale.paymentMethod?.trim() ? sale.paymentMethod : 'efectivo'

  return { quantity, unitPrice, totalAmount, date, paymentMethod }
}

const resolvePurchasePreview = (purchase: PurchaseEventInput) => {
  const date = resolveDefaultDate(purchase.date ?? null, purchase.periodHint ?? null)
  const paymentMethod = purchase.paymentMethod?.trim() ? purchase.paymentMethod : 'efectivo'
  return { date, paymentMethod }
}

const resolvePayrollPreview = (payroll: PayrollEventInput) => {
  const date = resolveDefaultDate(payroll.date ?? null, payroll.periodHint ?? null)
  const paymentMethod = payroll.paymentMethod?.trim() ? payroll.paymentMethod : 'efectivo'
  return { date, paymentMethod }
}

const resolveCustomerPaymentPreview = (payment: {
  date?: string | null
  periodHint?: string | null
  paymentMethod?: string | null
}) => {
  const date = resolveDefaultDate(payment.date ?? null, payment.periodHint ?? null)
  const paymentMethod = payment.paymentMethod?.trim() ? payment.paymentMethod : 'efectivo'
  return { date, paymentMethod }
}

const resolveSupplierPaymentPreview = (payment: {
  date?: string | null
  periodHint?: string | null
  paymentMethod?: string | null
}) => {
  const date = resolveDefaultDate(payment.date ?? null, payment.periodHint ?? null)
  const paymentMethod = payment.paymentMethod?.trim() ? payment.paymentMethod : 'efectivo'
  return { date, paymentMethod }
}

const findSimilarCustomers = async (companyId: string, rawName: string): Promise<{ exactMatch: Customer | null; matches: Customer[] }> => {
  const normalized = normalizeText(rawName)
  if (!normalized) return { exactMatch: null, matches: [] }

  const tokens = normalized.split(/\s+/).filter(Boolean)
  const searchTerm = tokens[0] ?? rawName
  const { items } = await arCustomerRepository.listByCompany(companyId, { search: searchTerm, limit: 50 })
  const exact = items.find((item) => normalizeText(item.name) === normalized) ?? null
  if (exact) return { exactMatch: exact, matches: [] }

  const minLength = Math.ceil(normalized.length / 2)
  const inputTokens = tokens
  const filtered = items.filter((item) => {
    const normalizedItem = normalizeText(item.name)
    if (!normalizedItem) return false
    if (normalizedItem.length < minLength) return false
    if (normalizedItem.includes(normalized) || normalized.startsWith(normalizedItem)) return true

    const itemTokens = normalizedItem.split(/\s+/).filter(Boolean)
    if (inputTokens.length === 0 || itemTokens.length === 0) return false

    const common = inputTokens.filter((token) => itemTokens.includes(token)).length
    const overlap = common / Math.max(inputTokens.length, itemTokens.length)
    return overlap >= 0.5
  })

  return { exactMatch: null, matches: filtered }
}

const findSimilarSuppliers = async (companyId: string, rawName: string): Promise<{ exactMatch: Supplier | null; matches: Supplier[] }> => {
  const normalized = normalizeText(rawName)
  if (!normalized) return { exactMatch: null, matches: [] }

  const tokens = normalized.split(/\s+/).filter(Boolean)
  const searchTerm = tokens[0] ?? rawName
  const { items } = await apSupplierRepository.listByCompany(companyId, { search: searchTerm, limit: 50 })
  const exact = items.find((item) => normalizeText(item.name) === normalized) ?? null
  if (exact) return { exactMatch: exact, matches: [] }

  const minLength = Math.ceil(normalized.length / 2)
  const inputTokens = tokens
  const filtered = items.filter((item) => {
    const normalizedItem = normalizeText(item.name)
    if (!normalizedItem) return false
    if (normalizedItem.length < minLength) return false
    if (normalizedItem.includes(normalized) || normalized.startsWith(normalizedItem)) return true

    const itemTokens = normalizedItem.split(/\s+/).filter(Boolean)
    if (inputTokens.length === 0 || itemTokens.length === 0) return false

    const common = inputTokens.filter((token) => itemTokens.includes(token)).length
    const overlap = common / Math.max(inputTokens.length, itemTokens.length)
    return overlap >= 0.5
  })

  return { exactMatch: null, matches: filtered }
}

const buildPendingSummary = (params: {
  eventType: PendingEventType
  data: Record<string, unknown>
  customerMatches: Customer[]
  exactCustomerMatch?: Customer | null
  supplierMatches: Supplier[]
  exactSupplierMatch?: Supplier | null
}) => {
  const lines: string[] = ['Confirma la operacion', '']

  if (params.eventType === 'sale') {
    const sale = params.data as SaleEventInput
    const preview = resolveSalePreview(sale)
    lines.push(
      'Tipo: Venta',
      `Descripcion: ${formatOptionalText(sale.description)}`,
      `Cantidad: ${preview.quantity > 0 ? preview.quantity : 'sin dato'}`,
      `Precio unitario: ${formatOptionalCurrency(preview.unitPrice ?? null)}`,
      `Total: ${formatOptionalCurrency(preview.totalAmount ?? null)}`,
      `Cliente detectado: ${formatOptionalText(sale.customerName)}`,
      `Forma de pago: ${formatOptionalText(preview.paymentMethod)}`,
      `Fecha: ${formatOptionalDate(preview.date)}`,
    )
  }

  if (params.eventType === 'purchase') {
    const purchase = params.data as PurchaseEventInput
    const preview = resolvePurchasePreview(purchase)
    lines.push(
      'Tipo: Compra',
      `Descripcion: ${formatOptionalText(purchase.description)}`,
      `Monto: ${formatOptionalCurrency(purchase.amount ?? null)}`,
      `Proveedor detectado: ${formatOptionalText(purchase.supplier)}`,
      `Forma de pago: ${formatOptionalText(preview.paymentMethod)}`,
      `Fecha: ${formatOptionalDate(preview.date)}`,
    )
  }

  if (params.eventType === 'payroll') {
    const payroll = params.data as unknown as PayrollEventInput
    const preview = resolvePayrollPreview(payroll)
    lines.push(
      'Tipo: Nomina',
      `Monto: ${formatOptionalCurrency(payroll.amount ?? null)}`,
      `Forma de pago: ${formatOptionalText(preview.paymentMethod)}`,
      `Fecha: ${formatOptionalDate(preview.date)}`,
    )
  }

  if (params.eventType === 'customer_payment') {
    const payment = params.data as { customerName?: string | null; amount?: number | null; paymentMethod?: string | null; date?: string | null }
    const preview = resolveCustomerPaymentPreview(payment)
    lines.push(
      'Tipo: Pago de cliente',
      `Cliente detectado: ${formatOptionalText(payment.customerName)}`,
      `Monto: ${formatOptionalCurrency(payment.amount ?? null)}`,
      `Forma de pago: ${formatOptionalText(preview.paymentMethod)}`,
      `Fecha: ${formatOptionalDate(preview.date)}`,
    )
  }

  if (params.eventType === 'supplier_payment') {
    const payment = params.data as { supplierName?: string | null; amount?: number | null; paymentMethod?: string | null; date?: string | null }
    const preview = resolveSupplierPaymentPreview(payment)
    lines.push(
      'Tipo: Pago a proveedor',
      `Proveedor detectado: ${formatOptionalText(payment.supplierName)}`,
      `Monto: ${formatOptionalCurrency(payment.amount ?? null)}`,
      `Forma de pago: ${formatOptionalText(preview.paymentMethod)}`,
      `Fecha: ${formatOptionalDate(preview.date)}`,
    )
  }

  if (params.exactCustomerMatch) {
    lines.push('', `Cliente confirmado: ${params.exactCustomerMatch.name}`)
  } else if (params.customerMatches.length > 0) {
    lines.push('', 'Encontre un cliente similar:')
    params.customerMatches.forEach((customer) => lines.push(`- ${customer.name}`))
  }

  if (params.exactSupplierMatch) {
    lines.push('', `Proveedor confirmado: ${params.exactSupplierMatch.name}`)
  } else if (params.supplierMatches.length > 0) {
    lines.push('', 'Encontre un proveedor similar:')
    params.supplierMatches.forEach((supplier) => lines.push(`- ${supplier.name}`))
  }

  lines.push('', 'Que deseas hacer?')
  return lines.join('\n')
}

const buildPendingReplyMarkup = (params: {
  pendingId: string
  eventType: PendingEventType
  customerName?: string | null
  customerMatches: Customer[]
  exactCustomerMatch?: Customer | null
  supplierName?: string | null
  supplierMatches: Supplier[]
  exactSupplierMatch?: Supplier | null
}) => {
  const rows: { text: string; callback_data: string }[][] = []
  const isCustomerEvent = isCustomerBasedEvent(params.eventType)
  const isSupplierEvent = isSupplierBasedEvent(params.eventType)
  const hasCustomerName = !!params.customerName?.trim()
  const hasSupplierName = !!params.supplierName?.trim()

  if (isCustomerEvent && params.exactCustomerMatch) {
    rows.push([
      {
        text: `Confirmar usando ${params.exactCustomerMatch.name}`,
        callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmCustomer, params.exactCustomerMatch.id),
      },
    ])
  } else if (isCustomerEvent && hasCustomerName) {
    if (params.customerMatches.length > 0) {
      params.customerMatches.forEach((customer) => {
        rows.push([
          {
            text: `Confirmar usando ${customer.name}`,
            callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmCustomer, customer.id),
          },
        ])
      })
    }

    rows.push([
      {
        text: `Crear nuevo cliente "${params.customerName?.trim()}"`,
        callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmNew),
      },
    ])
  } else if (isSupplierEvent && params.exactSupplierMatch) {
    rows.push([
      {
        text: `Confirmar usando ${params.exactSupplierMatch.name}`,
        callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmSupplier, params.exactSupplierMatch.id),
      },
    ])
  } else if (isSupplierEvent && hasSupplierName) {
    if (params.supplierMatches.length > 0) {
      params.supplierMatches.forEach((supplier) => {
        rows.push([
          {
            text: `Confirmar usando ${supplier.name}`,
            callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmSupplier, supplier.id),
          },
        ])
      })
    }

    rows.push([
      {
        text: `Crear nuevo proveedor "${params.supplierName?.trim()}"`,
        callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmNewSupplier),
      },
    ])
  } else {
    rows.push([
      {
        text: 'Confirmar',
        callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirm),
      },
    ])
  }

  rows.push([
    {
      text: 'Cancelar',
      callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.cancel),
    },
  ])

  return { inline_keyboard: rows }
}

const isAccountsReceivableEnabled = async (companyId: string) => {
  const settings = await arSettingsRepository.getByCompanyId(companyId)
  return settings?.enabled ?? false
}

const isAccountsPayableEnabled = async (companyId: string) => {
  const settings = await apSettingsRepository.getByCompanyId(companyId)
  return settings?.enabled ?? false
}

const getPeriodLabel = async (companyId: string, periodId?: string | null) => {
  if (!periodId) return 'no asignado'
  const period = await accountingPeriodRepository.findById(periodId)
  if (!period || period.companyId !== companyId) return periodId
  return period.name ?? period.id
}

const markPeriodPendingIfReopened = async (companyId: string, targetPeriodId?: string | null) => {
  const meta = resolvePeriodId.getLastResolutionMeta()
  if (!meta || !meta.reopenedClosed) return
  if (targetPeriodId && meta.periodId !== targetPeriodId) return
  const period = await accountingPeriodRepository.findById(meta.periodId)
  if (!period || period.companyId !== companyId) return
  if (period.status === AccountingPeriodStatus.CREATED) return
  await accountingPeriodRepository.save({ ...period, status: AccountingPeriodStatus.CREATED })
}

const createPendingEvent = async (params: {
  chatId: number
  companyId: string
  eventType: PendingEventType
  interpretedData: Record<string, unknown>
  customerName?: string | null
  supplierName?: string | null
}) => {
  const expiresAt = new Date(Date.now() + PENDING_EXPIRATION_MINUTES * 60 * 1000)
  const metadata = {
    ...(params.customerName ? { customerName: params.customerName } : {}),
    ...(params.supplierName ? { supplierName: params.supplierName } : {}),
  }
  const pending = await pendingEventRepository.create({
    companyId: params.companyId,
    telegramUserId: params.chatId,
    eventType: params.eventType,
    interpretedData: params.interpretedData,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
    status: 'PENDING_CONFIRMATION',
    expiresAt,
  })

  const { exactMatch: exactCustomerMatch, matches: customerMatches } =
    params.customerName && isCustomerBasedEvent(params.eventType)
      ? await findSimilarCustomers(params.companyId, params.customerName)
      : { exactMatch: null, matches: [] }

  const { exactMatch: exactSupplierMatch, matches: supplierMatches } =
    params.supplierName && isSupplierBasedEvent(params.eventType)
      ? await findSimilarSuppliers(params.companyId, params.supplierName)
      : { exactMatch: null, matches: [] }

  const summary = buildPendingSummary({
    eventType: params.eventType,
    data: params.interpretedData,
    customerMatches,
    exactCustomerMatch,
    supplierMatches,
    exactSupplierMatch,
  })
  const replyMarkup = buildPendingReplyMarkup({
    pendingId: pending.id,
    eventType: params.eventType,
    customerName: params.customerName,
    customerMatches,
    exactCustomerMatch,
    supplierName: params.supplierName,
    supplierMatches,
    exactSupplierMatch,
  })

  await TelegramClient.sendMessage({
    chatId: params.chatId,
    text: summary,
    parseMode: 'Markdown',
    replyMarkup,
  })

  return pending
}

const ensurePendingState = async (pending: PendingEvent | null): Promise<{ pending: PendingEvent; status: PendingEventStatus } | null> => {
  if (!pending) return null
  const now = new Date()
  if (pending.expiresAt && pending.expiresAt < now) {
    const expired = await pendingEventRepository.updateStatus(pending.id, 'EXPIRED')
    if (!expired) return null
    return { pending: expired, status: 'EXPIRED' }
  }
  return { pending, status: pending.status }
}

const executeSale = async (chatId: number, saleInput: SaleEventInput) => {
  const input = { ...saleInput, allowClosedReopen: true }
  const previousOpen = await accountingPeriodRepository.findOpenByCompany(input.companyId)
  const result = await registerSale(input)

  const entradas = result.movements.filter((m: Movement) => m.type === 'debit')
  const salidas = result.movements.filter((m: Movement) => m.type !== 'debit')

  const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')
  const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')

  const movementsText = []
  if (entradas.length > 0) movementsText.push(`Entradas 🟢:\n${entradasText}`)
  if (salidas.length > 0) movementsText.push(`Salidas 🔴:\n${salidasText}`)

  const movementsTextFinal = movementsText.join('\n\n')

  const isPending = result.status === 'pending'
  const statusIcon = isPending ? '📋' : '✅'
  const statusText = isPending ? '*Borrador guardado (Incompleto)*' : '*Venta registrada correctamente*'
  const periodLabel = await getPeriodLabel(input.companyId, result.periodId)
  const summary = `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${input.totalAmount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Completa los datos faltantes en el panel administrativo._' : ''}
        `.trim()

  await TelegramClient.sendMessage({
    chatId,
    text: summary,
    parseMode: 'Markdown',
  })

  if (previousOpen.length > 0 && previousOpen[0].id !== result.periodId) {
    await accountingPeriodRepository.markOpenExclusive(input.companyId, previousOpen[0].id)
  }
  await markPeriodPendingIfReopened(input.companyId, result.periodId)
}

const executePurchase = async (chatId: number, purchaseInput: PurchaseEventInput) => {
  const input = { ...purchaseInput, allowClosedReopen: true }
  const previousOpen = input.companyId ? await accountingPeriodRepository.findOpenByCompany(input.companyId) : []

  const result = await registerPurchase(input)

  const entradas = result.movements.filter((m) => m.type === 'debit')
  const salidas = result.movements.filter((m) => m.type !== 'debit')

  const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')
  const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')

  const movementsText = []
  if (entradas.length > 0) movementsText.push(`Entradas 🟢:\n${entradasText}`)
  if (salidas.length > 0) movementsText.push(`Salidas 🔴:\n${salidasText}`)

  const movementsTextFinal = movementsText.join('\n\n')

  const isPending = result.status === 'pending'
  const statusIcon = isPending ? '📋' : '✅'
  const statusText = isPending ? '*Borrador de Compra (Incompleto)*' : '*Compra registrada correctamente*'
  const periodLabel = input.companyId ? await getPeriodLabel(input.companyId, result.periodId) : 'no asignado'

  const summary = `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${input.amount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Completa los detalles en el panel administrativo._' : ''}
        `.trim()

  await TelegramClient.sendMessage({
    chatId,
    text: summary,
    parseMode: 'Markdown',
  })

  if (input.companyId && previousOpen.length > 0 && previousOpen[0].id !== result.periodId) {
    await accountingPeriodRepository.markOpenExclusive(input.companyId, previousOpen[0].id)
  }
  if (input.companyId) {
    await markPeriodPendingIfReopened(input.companyId, result.periodId)
  }
}

const executePayroll = async (chatId: number, payrollInput: PayrollEventInput) => {
  const input = { ...payrollInput, allowClosedReopen: true }
  const previousOpen = await accountingPeriodRepository.findOpenByCompany(input.companyId)

  const result = await registerPayroll(input)

  const entradas = result.movements.filter((m) => m.type === 'debit')
  const salidas = result.movements.filter((m) => m.type !== 'debit')

  const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')
  const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')

  const movementsText = []
  if (entradas.length > 0) movementsText.push(`Entradas 🟢:\n${entradasText}`)
  if (salidas.length > 0) movementsText.push(`Salidas 🔴:\n${salidasText}`)

  const movementsTextFinal = movementsText.join('\n\n')

  const isPending = result.status === 'pending'
  const statusIcon = isPending ? '📋' : '✅'
  const statusText = isPending ? '*Borrador de Nomina (Incompleto)*' : '*Pago de nomina registrado*'
  const periodLabel = await getPeriodLabel(input.companyId, result.periodId)

  const summary = `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${input.amount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Recuerda completar la informacion en el panel._' : ''}
        `.trim()

  await TelegramClient.sendMessage({
    chatId,
    text: summary,
    parseMode: 'Markdown',
  })

  if (previousOpen.length > 0 && previousOpen[0].id !== result.periodId) {
    await accountingPeriodRepository.markOpenExclusive(input.companyId, previousOpen[0].id)
  }
  await markPeriodPendingIfReopened(input.companyId, result.periodId)
}

const executeCustomerPayment = async (
  chatId: number,
  paymentInput: {
    companyId: string
    amount: number
    date?: string | null
    periodHint?: string | null
    paymentMethod?: string | null
    customerName: string
  },
) => {
  const amount = Number(paymentInput.amount ?? 0)
  const result = await registerCustomerPayment({
    companyId: paymentInput.companyId,
    amount,
    date: paymentInput.date ?? undefined,
    periodHint: paymentInput.periodHint ?? undefined,
    paymentMethod: paymentInput.paymentMethod ?? undefined,
    customerName: paymentInput.customerName,
    allowClosedReopen: true,
    description: `Pago de ${paymentInput.customerName}`,
  })

  const entradas = result.movements.filter((m: Movement) => m.type === 'debit')
  const salidas = result.movements.filter((m: Movement) => m.type !== 'debit')

  const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')
  const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')

  const movementsText = []
  if (entradas.length > 0) movementsText.push(`Entradas 🟢:\n${entradasText}`)
  if (salidas.length > 0) movementsText.push(`Salidas 🔴:\n${salidasText}`)

  const movementsTextFinal = movementsText.join('\n\n')

  const isPending = result.status === 'pending'
  const statusIcon = isPending ? '📋' : '✅'
  const statusText = isPending ? '*Borrador de Pago (Incompleto)*' : '*Pago de cliente registrado*'
  const periodLabel = await getPeriodLabel(paymentInput.companyId, result.periodId)

  await TelegramClient.sendMessage({
    chatId,
    text: `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${amount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Completa los detalles en el panel administrativo._' : ''}
          `.trim(),
    parseMode: 'Markdown',
  })

  if (result.periodId) {
    await markPeriodPendingIfReopened(paymentInput.companyId, result.periodId)
  }
}

const executeSupplierPayment = async (
  chatId: number,
  paymentInput: {
    companyId: string
    amount: number
    date?: string | null
    periodHint?: string | null
    paymentMethod?: string | null
    supplierName: string
  },
) => {
  const amount = Number(paymentInput.amount ?? 0)
  const result = await registerSupplierPayment({
    companyId: paymentInput.companyId,
    amount,
    date: paymentInput.date ?? undefined,
    periodHint: paymentInput.periodHint ?? undefined,
    paymentMethod: paymentInput.paymentMethod ?? undefined,
    supplierName: paymentInput.supplierName,
    allowClosedReopen: true,
    description: `Pago a ${paymentInput.supplierName}`,
  })

  const entradas = result.movements.filter((m: Movement) => m.type === 'debit')
  const salidas = result.movements.filter((m: Movement) => m.type !== 'debit')

  const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')
  const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')

  const movementsText = []
  if (entradas.length > 0) movementsText.push(`Entradas 🟢:\n${entradasText}`)
  if (salidas.length > 0) movementsText.push(`Salidas 🔴:\n${salidasText}`)

  const movementsTextFinal = movementsText.join('\n\n')

  const isPending = result.status === 'pending'
  const statusIcon = isPending ? '📋' : '✅'
  const statusText = isPending ? '*Borrador de Pago (Incompleto)*' : '*Pago a proveedor registrado*'
  const periodLabel = await getPeriodLabel(paymentInput.companyId, result.periodId)

  await TelegramClient.sendMessage({
    chatId,
    text: `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${amount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Completa los detalles en el panel administrativo._' : ''}
          `.trim(),
    parseMode: 'Markdown',
  })

  if (result.periodId) {
    await markPeriodPendingIfReopened(paymentInput.companyId, result.periodId)
  }
}

router.post('/webhook', async (req: Request, res: Response) => {
  const update = req.body
  const chatId: number | null = update?.message?.chat?.id ?? update?.callback_query?.message?.chat?.id ?? null

  try {
    await pendingEventRepository.expirePastDue()

    if (update?.callback_query) {
      const callback = update.callback_query
      const parsed = parseCallbackData(callback.data)
      if (parsed && ensureChatId(chatId, res)) {
        await TelegramClient.answerCallbackQuery(callback.id)

        const pending = await pendingEventRepository.findById(parsed.pendingId)
        const pendingState = await ensurePendingState(pending)
        if (!pendingState) {
          await TelegramClient.sendMessage({ chatId, text: 'Este evento ya no esta disponible.' })
          return res.status(200).json({ ok: true })
        }

        if (pendingState.status === 'EXPIRED') {
          await TelegramClient.sendMessage({ chatId, text: 'Este evento expiro y no se ejecutara.' })
          return res.status(200).json({ ok: true })
        }

        if (pendingState.status !== 'PENDING_CONFIRMATION') {
          await TelegramClient.sendMessage({ chatId, text: 'Este evento ya no esta disponible.' })
          return res.status(200).json({ ok: true })
        }

        if (parsed.action === CALLBACK_ACTIONS.cancel) {
          await pendingEventRepository.updateStatus(pendingState.pending.id, 'CANCELLED')
          await TelegramClient.sendMessage({ chatId, text: 'Operacion cancelada.' })
          return res.status(200).json({ ok: true })
        }

        const eventType = pendingState.pending.eventType
        const rawData = pendingState.pending.interpretedData
        let customerNameOverride: string | null = null
        let supplierNameOverride: string | null = null

        if (parsed.action === CALLBACK_ACTIONS.confirmCustomer) {
          if (!parsed.entityId) {
            await TelegramClient.sendMessage({ chatId, text: 'No pude identificar el cliente seleccionado.' })
            return res.status(200).json({ ok: true })
          }
          const customer = await arCustomerRepository.findById(parsed.entityId)
          if (!customer || customer.companyId !== pendingState.pending.companyId) {
            await TelegramClient.sendMessage({ chatId, text: 'El cliente seleccionado no es valido.' })
            return res.status(200).json({ ok: true })
          }
          customerNameOverride = customer.name
        }

        if (parsed.action === CALLBACK_ACTIONS.confirmNew) {
          const originalName = (rawData as { customerName?: string | null }).customerName
          if (!originalName?.trim()) {
            await TelegramClient.sendMessage({ chatId, text: 'No pude identificar el nombre del cliente.' })
            return res.status(200).json({ ok: true })
          }
          customerNameOverride = originalName
        }

        if (parsed.action === CALLBACK_ACTIONS.confirmSupplier) {
          if (!parsed.entityId) {
            await TelegramClient.sendMessage({ chatId, text: 'No pude identificar el proveedor seleccionado.' })
            return res.status(200).json({ ok: true })
          }
          const supplier = await apSupplierRepository.findById(parsed.entityId)
          if (!supplier || supplier.companyId !== pendingState.pending.companyId) {
            await TelegramClient.sendMessage({ chatId, text: 'El proveedor seleccionado no es valido.' })
            return res.status(200).json({ ok: true })
          }
          supplierNameOverride = supplier.name
        }

        if (parsed.action === CALLBACK_ACTIONS.confirmNewSupplier) {
          const originalName =
            (rawData as { supplier?: string | null; supplierName?: string | null }).supplier ??
            (rawData as { supplierName?: string | null }).supplierName
          if (!originalName?.trim()) {
            await TelegramClient.sendMessage({ chatId, text: 'No pude identificar el nombre del proveedor.' })
            return res.status(200).json({ ok: true })
          }
          supplierNameOverride = originalName
        }

        if (
          parsed.action === CALLBACK_ACTIONS.confirm ||
          parsed.action === CALLBACK_ACTIONS.confirmCustomer ||
          parsed.action === CALLBACK_ACTIONS.confirmNew ||
          parsed.action === CALLBACK_ACTIONS.confirmSupplier ||
          parsed.action === CALLBACK_ACTIONS.confirmNewSupplier
        ) {
          try {
            if (eventType === 'sale') {
              const saleInput = rawData as SaleEventInput
              const updated = customerNameOverride ? { ...saleInput, customerName: customerNameOverride } : saleInput
              await executeSale(chatId, updated)
            }

            if (eventType === 'purchase') {
              const purchaseInput = rawData as PurchaseEventInput
              const updated = supplierNameOverride ? { ...purchaseInput, supplier: supplierNameOverride } : purchaseInput
              await executePurchase(chatId, updated)
            }

            if (eventType === 'payroll') {
              await executePayroll(chatId, rawData as unknown as PayrollEventInput)
            }

            if (eventType === 'customer_payment') {
              const paymentInput = rawData as {
                companyId: string
                amount: number
                date?: string | null
                periodHint?: string | null
                paymentMethod?: string | null
                customerName: string
              }
              const updated = customerNameOverride ? { ...paymentInput, customerName: customerNameOverride } : paymentInput
              await executeCustomerPayment(chatId, updated)
            }

            if (eventType === 'supplier_payment') {
              const paymentInput = rawData as {
                companyId: string
                amount: number
                date?: string | null
                periodHint?: string | null
                paymentMethod?: string | null
                supplierName: string
              }
              const updated = supplierNameOverride ? { ...paymentInput, supplierName: supplierNameOverride } : paymentInput
              await executeSupplierPayment(chatId, updated)
            }

            await pendingEventRepository.updateStatus(pendingState.pending.id, 'CONFIRMED')
          } catch (err) {
            const message = err instanceof Error ? err.message : 'No pude ejecutar la operacion'
            await TelegramClient.sendMessage({ chatId, text: `No pude ejecutar la operacion: ${message}` })
          }

          return res.status(200).json({ ok: true })
        }
      }

      return res.status(200).json({ ok: true })
    }

    const message = update?.message
    const rawText = message ? await TelegramAdapter.getMessageText(message) : null
    if (rawText && isGreetingOrHelp(rawText)) {
      if (!ensureChatId(chatId, res)) return
      const userName = (await userRepository.findByTelegramId(chatId))?.name
      await TelegramClient.sendMessage({
        chatId,
        text: formatHelpMessage(userName),
        parseMode: 'Markdown',
      })
      return res.status(200).json({ ok: true })
    }

    const detected = await TelegramAdapter.detectAndParse(
      update,
      {
        userRepository,
      },
      rawText ?? undefined,
    )

    if (!detected) return res.status(200).json({ ok: true })

    // -----------------------------------------------------------------
    // VENTA
    // -----------------------------------------------------------------
    if (detected.type === 'sale') {
      try {
        if (!ensureChatId(chatId, res)) return
        const saleInput = detected.data as SaleEventInput
        if (!saleInput.companyId) throw new Error('Empresa no definida')

        await createPendingEvent({
          chatId,
          companyId: saleInput.companyId,
          eventType: 'sale',
          interpretedData: saleInput as Record<string, unknown>,
          customerName: saleInput.customerName ?? null,
        })

        return res.status(200).json({ ok: true })
      } catch (err) {
        if (!ensureChatId(chatId, res)) return
        const message = err instanceof Error ? err.message : 'Error interno preparando la venta'
        await TelegramClient.sendMessage({ chatId, text: `No pude preparar la venta: ${message}` })
        return res.status(200).json({ ok: true })
      }
    }

    // -----------------------------------------------------------------
    // COMPRA
    // -----------------------------------------------------------------
    if (detected.type === 'purchase') {
      try {
        if (!ensureChatId(chatId, res)) return
        const purchaseInput = detected.data as PurchaseEventInput
        if (!purchaseInput.companyId) throw new Error('Empresa no definida')

        await createPendingEvent({
          chatId,
          companyId: purchaseInput.companyId,
          eventType: 'purchase',
          interpretedData: purchaseInput as Record<string, unknown>,
          supplierName: purchaseInput.supplier ?? null,
        })

        return res.status(200).json({ ok: true })
      } catch (err) {
        if (!ensureChatId(chatId, res)) return
        const message = err instanceof Error ? err.message : 'Error interno preparando la compra'
        await TelegramClient.sendMessage({ chatId, text: `No pude preparar la compra: ${message}` })
        return res.status(200).json({ ok: true })
      }
    }

    // -----------------------------------------------------------------
    // PAYROLL
    // -----------------------------------------------------------------
    if (detected.type === 'payroll') {
      try {
        if (!ensureChatId(chatId, res)) return
        const payrollInput = detected.data as PayrollEventInput
        if (!payrollInput.companyId) throw new Error('Empresa no definida')

        await createPendingEvent({
          chatId,
          companyId: payrollInput.companyId,
          eventType: 'payroll',
          interpretedData: payrollInput as unknown as Record<string, unknown>,
        })

        return res.status(200).json({ ok: true })
      } catch (err) {
        if (!ensureChatId(chatId, res)) return
        const message = err instanceof Error ? err.message : 'Error interno preparando la nomina'
        await TelegramClient.sendMessage({ chatId, text: `No pude preparar la nomina: ${message}` })
        return res.status(200).json({ ok: true })
      }
    }

    // -----------------------------------------------------------------
    // PAGO DE CLIENTE
    // -----------------------------------------------------------------
    if (detected.type === 'customer_payment') {
      try {
        if (!ensureChatId(chatId, res)) return
        const paymentInput = detected.data
        if (!paymentInput.companyId) throw new Error('Empresa no definida')
        if (!paymentInput.customerName?.trim()) throw new Error('Debes indicar el nombre del cliente')
        const amount = Number(paymentInput.amount ?? 0)
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('Monto invalido')

        await createPendingEvent({
          chatId,
          companyId: paymentInput.companyId,
          eventType: 'customer_payment',
          interpretedData: paymentInput as Record<string, unknown>,
          customerName: paymentInput.customerName ?? null,
        })

        return res.status(200).json({ ok: true })
      } catch (err) {
        if (!ensureChatId(chatId, res)) return
        const message = err instanceof Error ? err.message : 'Error interno preparando el pago'
        await TelegramClient.sendMessage({ chatId, text: `No pude preparar el pago: ${message}` })
        return res.status(200).json({ ok: true })
      }
    }

    // -----------------------------------------------------------------
    // PAGO A PROVEEDOR
    // -----------------------------------------------------------------
    if (detected.type === 'supplier_payment') {
      try {
        if (!ensureChatId(chatId, res)) return
        const paymentInput = detected.data
        if (!paymentInput.companyId) throw new Error('Empresa no definida')
        if (!paymentInput.supplierName?.trim()) throw new Error('Debes indicar el nombre del proveedor')
        const amount = Number(paymentInput.amount ?? 0)
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('Monto invalido')

        await createPendingEvent({
          chatId,
          companyId: paymentInput.companyId,
          eventType: 'supplier_payment',
          interpretedData: paymentInput as Record<string, unknown>,
          supplierName: paymentInput.supplierName ?? null,
        })

        return res.status(200).json({ ok: true })
      } catch (err) {
        if (!ensureChatId(chatId, res)) return
        const message = err instanceof Error ? err.message : 'Error interno preparando el pago'
        await TelegramClient.sendMessage({ chatId, text: `No pude preparar el pago: ${message}` })
        return res.status(200).json({ ok: true })
      }
    }

    if (detected.type === 'ar_query') {
      try {
        const queryInput = detected.data
        if (!queryInput.companyId) throw new Error('Empresa no definida')

        const arEnabled = await isAccountsReceivableEnabled(queryInput.companyId)
        if (!arEnabled && queryInput.queryType !== 'customer_statement') {
          if (!ensureChatId(chatId, res)) return
          await TelegramClient.sendMessage({
            chatId,
            text: 'Cuentas por cobrar no esta activado para tu empresa.',
          })
          return res.status(200).json({ ok: true })
        }

        if (queryInput.queryType === 'list_debtors') {
          const items = await listCustomersWithBalance({ companyId: queryInput.companyId })
          const filtered = items.filter((item) => item.balance > 0)
          if (filtered.length === 0) {
            if (!ensureChatId(chatId, res)) return
            await TelegramClient.sendMessage({ chatId, text: '✅ ¡Excelente! No tienes clientes con saldo pendiente.' })
            return res.status(200).json({ ok: true })
          }

          const lines = filtered.map((item) => `💳 ${item.customer.name}: ${formatCurrency(item.balance)}`).join('\n')
          const totalDebt = filtered.reduce((sum, item) => sum + item.balance, 0)

          if (!ensureChatId(chatId, res)) return
          await TelegramClient.sendMessage({
            chatId,
            text: `📊 *Clientes con saldo pendiente:*\n\n${lines}\n\n💰 *Total adeudado:* ${formatCurrency(totalDebt)}`,
            parseMode: 'Markdown',
          })
          return res.status(200).json({ ok: true })
        }

        if (queryInput.queryType === 'customer_balance') {
          if (!queryInput.customerName) throw new Error('Debes indicar el nombre del cliente')
          const result = await getCustomerBalance({ companyId: queryInput.companyId, customerName: queryInput.customerName })
          if (!result) {
            if (!ensureChatId(chatId, res)) return
            await TelegramClient.sendMessage({
              chatId,
              text: `❌ No encontre al cliente *${queryInput.customerName}*.`,
              parseMode: 'Markdown',
            })
            return res.status(200).json({ ok: true })
          }

          if (!ensureChatId(chatId, res)) return
          const statusIcon = result.balance > 0 ? '💳' : '✅'
          const message = result.balance > 0 ? `${statusIcon} *${result.customer.name}* debe:\n*${formatCurrency(result.balance)}*` : `${statusIcon} *${result.customer.name}* está al día ✓`
          await TelegramClient.sendMessage({
            chatId,
            text: message,
            parseMode: 'Markdown',
          })
          return res.status(200).json({ ok: true })
        }

        if (queryInput.queryType === 'customer_statement') {
          if (!queryInput.customerName) throw new Error('Debes indicar el nombre del cliente')
          const result = await getCustomerStatement({ companyId: queryInput.companyId, customerName: queryInput.customerName })
          if (!result) {
            if (!ensureChatId(chatId, res)) return
            await TelegramClient.sendMessage({
              chatId,
              text: `❌ No encontre al cliente *${queryInput.customerName}*.`,
              parseMode: 'Markdown',
            })
            return res.status(200).json({ ok: true })
          }

          const lines = result.entries.map((entry) => {
            const typeIcon = entry.type === 'sale' ? '📈' : '💰'
            const typeLabel = entry.type === 'sale' ? 'Venta' : 'Pago'
            return `${typeIcon} ${formatDate(entry.date)} - ${typeLabel}: ${formatCurrency(entry.amount)}`
          })

          if (!ensureChatId(chatId, res)) return
          const statusIcon = result.balance > 0 ? '💳' : '✅'
          const balanceLine = result.balance > 0 ? `\n*${statusIcon} Saldo pendiente:* ${formatCurrency(result.balance)}` : `\n*${statusIcon} Cuenta al día* ✓`
          await TelegramClient.sendMessage({
            chatId,
            text: `📋 *Extracto de ${result.customer.name}*\n${lines.join('\n')}${balanceLine}`,
            parseMode: 'Markdown',
          })
          return res.status(200).json({ ok: true })
        }

        throw new Error('Consulta no reconocida')
      } catch (err) {
        if (!ensureChatId(chatId, res)) return
        const message = err instanceof Error ? err.message : 'Error interno consultando cuentas por cobrar'
        await TelegramClient.sendMessage({ chatId, text: `No pude responder la consulta: ${message}` })
        return res.status(200).json({ ok: true })
      }
    }

    if (detected.type === 'ap_query') {
      try {
        const queryInput = detected.data
        if (!queryInput.companyId) throw new Error('Empresa no definida')

        const apEnabled = await isAccountsPayableEnabled(queryInput.companyId)
        if (!apEnabled && queryInput.queryType !== 'supplier_statement') {
          if (!ensureChatId(chatId, res)) return
          await TelegramClient.sendMessage({
            chatId,
            text: 'Cuentas por pagar no esta activado para tu empresa.',
          })
          return res.status(200).json({ ok: true })
        }

        if (queryInput.queryType === 'list_creditors') {
          const items = await listSuppliersWithBalance({ companyId: queryInput.companyId })
          const filtered = items.filter((item) => item.balance > 0)
          if (filtered.length === 0) {
            if (!ensureChatId(chatId, res)) return
            await TelegramClient.sendMessage({ chatId, text: '✅ ¡Excelente! No tienes proveedores con saldo pendiente.' })
            return res.status(200).json({ ok: true })
          }

          const lines = filtered.map((item) => `💳 ${item.supplier.name}: ${formatCurrency(item.balance)}`).join('\n')
          const totalDebt = filtered.reduce((sum, item) => sum + item.balance, 0)

          if (!ensureChatId(chatId, res)) return
          await TelegramClient.sendMessage({
            chatId,
            text: `📊 *Proveedores con saldo pendiente:*\n\n${lines}\n\n💰 *Total adeudado:* ${formatCurrency(totalDebt)}`,
            parseMode: 'Markdown',
          })
          return res.status(200).json({ ok: true })
        }

        if (queryInput.queryType === 'supplier_balance') {
          if (!queryInput.supplierName) throw new Error('Debes indicar el nombre del proveedor')
          const result = await getSupplierBalance({ companyId: queryInput.companyId, supplierName: queryInput.supplierName })
          if (!result) {
            if (!ensureChatId(chatId, res)) return
            await TelegramClient.sendMessage({
              chatId,
              text: `❌ No encontre al proveedor *${queryInput.supplierName}*.`,
              parseMode: 'Markdown',
            })
            return res.status(200).json({ ok: true })
          }

          if (!ensureChatId(chatId, res)) return
          const statusIcon = result.balance > 0 ? '💳' : '✅'
          const message =
            result.balance > 0
              ? `${statusIcon} *${result.supplier.name}* tiene saldo pendiente:\n*${formatCurrency(result.balance)}*`
              : `${statusIcon} *${result.supplier.name}* está al día ✓`
          await TelegramClient.sendMessage({
            chatId,
            text: message,
            parseMode: 'Markdown',
          })
          return res.status(200).json({ ok: true })
        }

        if (queryInput.queryType === 'supplier_statement') {
          if (!queryInput.supplierName) throw new Error('Debes indicar el nombre del proveedor')
          const result = await getSupplierStatement({ companyId: queryInput.companyId, supplierName: queryInput.supplierName })
          if (!result) {
            if (!ensureChatId(chatId, res)) return
            await TelegramClient.sendMessage({
              chatId,
              text: `❌ No encontre al proveedor *${queryInput.supplierName}*.`,
              parseMode: 'Markdown',
            })
            return res.status(200).json({ ok: true })
          }

          const lines = result.entries.map((entry) => {
            const typeIcon = entry.type === 'purchase' ? '📉' : '💰'
            const typeLabel = entry.type === 'purchase' ? 'Compra' : 'Pago'
            return `${typeIcon} ${formatDate(entry.date)} - ${typeLabel}: ${formatCurrency(entry.amount)}`
          })

          if (!ensureChatId(chatId, res)) return
          const statusIcon = result.balance > 0 ? '💳' : '✅'
          const balanceLine = result.balance > 0 ? `\n*${statusIcon} Saldo pendiente:* ${formatCurrency(result.balance)}` : `\n*${statusIcon} Cuenta al día* ✓`
          await TelegramClient.sendMessage({
            chatId,
            text: `📋 *Extracto de ${result.supplier.name}*\n${lines.join('\n')}${balanceLine}`,
            parseMode: 'Markdown',
          })
          return res.status(200).json({ ok: true })
        }

        throw new Error('Consulta no reconocida')
      } catch (err) {
        if (!ensureChatId(chatId, res)) return
        const message = err instanceof Error ? err.message : 'Error interno consultando cuentas por pagar'
        await TelegramClient.sendMessage({ chatId, text: `No pude responder la consulta: ${message}` })
        return res.status(200).json({ ok: true })
      }
    }

    if (detected.type === 'income_statement_query') {
      try {
        const { period, companyId } = detected
        if (!period) throw new Error('Periodo no definido')

        const result = await generateIncomeStatement(companyId, { start: period.start, end: period.end })
        const net = result.totals.incomeBeforeTaxes
        const verb = net >= 0 ? 'Ganaste' : 'Perdiste'
        const amount = formatCurrency(Math.abs(net))

        if (!ensureChatId(chatId, res)) return

        await TelegramClient.sendMessage({
          chatId,
          text: `${verb} ${amount} entre ${period.start} y ${period.end}`,
          parseMode: 'Markdown',
        })

        return res.status(200).json({ ok: true })
      } catch (err) {
        if (!ensureChatId(chatId, res)) return
        const message = err instanceof Error ? err.message : 'No pude calcular la utilidad'
        await TelegramClient.sendMessage({ chatId, text: `No pude calcular la utilidad: ${message}` })
        return res.status(200).json({ ok: true })
      }
    }

    if (detected.type === 'income_statement_error') {
      if (!ensureChatId(chatId, res)) return
      await TelegramClient.sendMessage({
        chatId,
        text: 'No pude entender el periodo. Dime: "cuánto gané hoy", "esta semana", "este mes" o "este año".',
      })
      return res.status(200).json({ ok: true })
    }

    if (detected.type === 'customer_payment_error') {
      if (!ensureChatId(chatId, res)) return
      await TelegramClient.sendMessage({
        chatId,
        text: 'No pude entender el pago del cliente. Ejemplo: "Alfredo Celis me pago 400000 en efectivo".',
      })
      return res.status(200).json({ ok: true })
    }

    if (detected.type === 'supplier_payment_error') {
      if (!ensureChatId(chatId, res)) return
      await TelegramClient.sendMessage({
        chatId,
        text: 'No pude entender el pago al proveedor. Ejemplo: "Pague 400000 a Textiles Andinos en efectivo".',
      })
      return res.status(200).json({ ok: true })
    }

    if (detected.type === 'ar_query_error') {
      if (!ensureChatId(chatId, res)) return
      await TelegramClient.sendMessage({
        chatId,
        text: 'No pude entender la consulta. Ejemplos: "quien me debe", "cuanto me debe Alfredo", "extracto de Alfredo".',
      })
      return res.status(200).json({ ok: true })
    }

    if (detected.type === 'ap_query_error') {
      if (!ensureChatId(chatId, res)) return
      await TelegramClient.sendMessage({
        chatId,
        text: 'No pude entender la consulta. Ejemplos: "a quien le debo", "cuanto le debo a Textiles Andinos", "extracto de Textiles Andinos".',
      })
      return res.status(200).json({ ok: true })
    }

    // -----------------------------------------------------------------
    // ERRORES DE PARSEO
    // -----------------------------------------------------------------
    if (detected.type === 'sale_error') {
      if (!ensureChatId(chatId, res)) return

      await TelegramClient.sendMessage({
        chatId,
        text: `
No logre entender la venta.
Debes indicar cantidad, producto, precio, costo y si incluye IVA.
        `.trim(),
        parseMode: 'Markdown',
      })

      return res.status(200).json({ ok: true })
    }

    if (detected.type === 'purchase_error') {
      if (!ensureChatId(chatId, res)) return

      await TelegramClient.sendMessage({
        chatId,
        text: `
No logre entender la compra.
Ejemplo: "Compre tela por 700.000 sin IVA, pagado por banco, es insumo".
        `.trim(),
        parseMode: 'Markdown',
      })

      return res.status(200).json({ ok: true })
    }

    if (detected.type === 'payroll_error') {
      if (!ensureChatId(chatId, res)) return

      await TelegramClient.sendMessage({
        chatId,
        text: `
No logre entender el pago de nomina.
Ejemplos:
- pague nomina 500000 por banco
- pague empleados 700000 en efectivo
        `.trim(),
        parseMode: 'Markdown',
      })

      return res.status(200).json({ ok: true })
    }

    // -----------------------------------------------------------------
    // MENSAJE NO CLASIFICADO
    // -----------------------------------------------------------------
    if (detected.type === 'unknown') {
      if (!ensureChatId(chatId, res)) return

      await TelegramClient.sendMessage({
        chatId,
        text: `
No reconozco si tu mensaje es venta, compra, pago de nomina o pago de cliente.

💵 *Venta:*
"Vendi 10 pantalones a 50.000 me cuesta 36.000"
y si es necesario un cliente puedes agregar:
"Vendi 10 pantalones a 50.000 me cuesta 36.000 a Alfredo Celis"

📦 *Compra:*
"Compre cremalleras por 300.000 sin IVA en efectivo"

👥 *Nómina:*
"pague nomina 500000 por banco"

💰 *Pago de cliente:*
"Alfredo Celis me pago 400000 en efectivo"
        `.trim(),
        parseMode: 'Markdown',
      })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error manejando webhook:', error)

    if (ensureChatId(chatId, res)) {
      TelegramClient.sendMessage({
        chatId,
        text: 'Error interno procesando tu mensaje.',
      })
    }

    return res.status(200).json({ ok: true })
  }
})

export { router as telegramRoutes }
