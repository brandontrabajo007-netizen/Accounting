import { aiClassifyEvent } from '@application/parsers/aiEventClassifier'
import { aiParsePurchase } from '@application/parsers/aiParsePurchase'
import { aiParsePayroll } from '@application/parsers/aiPayrollParser'
import { aiParseSale } from '@application/parsers/aiSaleParser'

import type { UserRepository } from '@application/shared/ports/UserRepository'
import { TelegramClient } from './telegramClient'

import type { DetectedEvent, ParsedIncomeStatementQuery, ParsedTelegramPayroll, ParsedTelegramPurchase, ParsedTelegramSale, TelegramUpdate } from './telegramTypes'

// Normaliza fecha/periodo cuando el usuario no menciona año: asume el año actual
const applyCurrentYearIfMissing = (rawText: string, input: { date?: string | null; periodHint?: string | null }) => {
  const yearMentioned = /\b20\d{2}\b/.test(rawText)
  if (yearMentioned) return

  const currentYear = new Date().getUTCFullYear()

  if (input.date) {
    const d = new Date(input.date)
    if (!Number.isNaN(d.getTime())) {
      d.setUTCFullYear(currentYear)
      input.date = d.toISOString()
    }
  }

  if (input.periodHint) {
    const match = input.periodHint.match(/^\d{4}-(\d{2})$/)
    if (match) {
      input.periodHint = `${currentYear}-${match[1]}`
    }
  }
}

const bogotaFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const getBogotaTodayUtc = () => {
  const parts = bogotaFormatter.format(new Date()).split('-').map(Number)
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
}

const toDateString = (d: Date) => d.toISOString().slice(0, 10)

const monthNames: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
}

const parseSpanishDate = (raw: string): Date | null => {
  // Ej: "22 de diciembre", "22 de diciembre de 2024", "2024-12-22"
  const isoMatch = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (isoMatch) {
    const [_, y, m, d] = isoMatch
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
    return Number.isNaN(date.getTime()) ? null : date
  }

  const dmMatch = raw.match(/(\d{1,2})\s+de\s+([a-zA-Záéíóúñ]+)(?:\s+de\s+(\d{4}))?/i)
  if (!dmMatch) return null

  const day = Number(dmMatch[1])
  const monthName = dmMatch[2].toLowerCase()
  const year = dmMatch[3] ? Number(dmMatch[3]) : getBogotaTodayUtc().getUTCFullYear()
  const month = monthNames[monthName]
  if (month === undefined) return null

  const date = new Date(Date.UTC(year, month, day))
  return Number.isNaN(date.getTime()) ? null : date
}

export const TelegramAdapter = {
  async getMessageText(message: TelegramUpdate['message']): Promise<string | null> {
    if (!message) return null

    const directText = message.text?.trim() ?? null
    const voice = message.voice ?? message.audio

    if (directText) return directText

    if (voice) {
      try {
        const file = await TelegramClient.getFileDownloadUrl(voice.file_id)
        const transcript = await TelegramClient.transcribeAudio(file)
        if (!transcript) return null
        return transcript.trim()
      } catch {
        return null
      }
    }

    return null
  },

  parseIncomeStatementPeriod(text: string): ParsedIncomeStatementQuery['period'] | null {
    const lower = text.toLowerCase()

    // Día específico: "día 24 de diciembre", "el 2025-12-24"
    const singleDayMatch = lower.match(/(?:^|\b)(?:el\s+|d[ií]a\s+)?(\d{1,2}\s+de\s+[a-záéíóúñ]+(?:\s+de\s+\d{4})?|\d{4}-\d{2}-\d{2})/)
    if (singleDayMatch) {
      const date = parseSpanishDate(singleDayMatch[1])
      if (date) return { start: toDateString(date), end: toDateString(date) }
    }

    // Mes específico: "mes de enero", "enero 2025"
    const monthMatch = lower.match(/mes\s+de\s+([a-záéíóúñ]+)(?:\s+de\s+(\d{4}))?/) || lower.match(/\b([a-záéíóúñ]+)\s+(\d{4})?\s*$/)
    if (monthMatch) {
      const name = (monthMatch[1] ?? '').toLowerCase()
      const month = monthNames[name]
      if (month !== undefined) {
        const year = monthMatch[2] ? Number(monthMatch[2]) : getBogotaTodayUtc().getUTCFullYear()
        const start = new Date(Date.UTC(year, month, 1))
        const end = new Date(Date.UTC(year, month + 1, 0)) // último día del mes
        return { start: toDateString(start), end: toDateString(end) }
      }
    }

    if (lower.includes('hoy')) {
      const d = getBogotaTodayUtc()
      return { start: toDateString(d), end: toDateString(d) }
    }

    if (lower.includes('esta semana') || lower.includes('semana actual')) {
      const today = getBogotaTodayUtc()
      const day = today.getUTCDay() === 0 ? 7 : today.getUTCDay() // domingo=7
      const start = new Date(today)
      start.setUTCDate(today.getUTCDate() - (day - 1)) // lunes
      return { start: toDateString(start), end: toDateString(today) }
    }

    if (lower.includes('semana pasada')) {
      const today = getBogotaTodayUtc()
      const day = today.getUTCDay() === 0 ? 7 : today.getUTCDay()
      const startCurrentWeek = new Date(today)
      startCurrentWeek.setUTCDate(today.getUTCDate() - (day - 1)) // lunes actual
      const start = new Date(startCurrentWeek)
      start.setUTCDate(startCurrentWeek.getUTCDate() - 7)
      const end = new Date(start)
      end.setUTCDate(start.getUTCDate() + 6)
      return { start: toDateString(start), end: toDateString(end) }
    }

    if (lower.includes('este mes') || lower.includes('mes actual')) {
      const today = getBogotaTodayUtc()
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
      const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)) // último día del mes
      return { start: toDateString(start), end: toDateString(end) }
    }

    // Rango explícito: "del 22 de diciembre al 28 de diciembre" o "2024-12-22 al 2024-12-28"
    const rangeMatch = lower.match(/del\s+(.+?)\s+al\s+(.+)/i)
    if (rangeMatch) {
      const fromText = rangeMatch[1]
      const toText = rangeMatch[2]
      const startDate = parseSpanishDate(fromText)
      const endDate = parseSpanishDate(toText)
      if (startDate && endDate) {
        return { start: toDateString(startDate), end: toDateString(endDate) }
      }
    }

    return null
  },

  // ---------------------------------------------------------------------
  // ✅ 1. PARSE SALE
  // ---------------------------------------------------------------------
  async toSaleInput(update: TelegramUpdate, deps: { userRepository: UserRepository }): Promise<ParsedTelegramSale | null> {
    const message = update.message
    if (!message) return null

    const chatId = message.chat.id
    const user = await deps.userRepository.findByTelegramId(chatId)
    if (!user) return null

    const text = await this.getMessageText(message)
    if (!text) return null

    const sale = await aiParseSale(text)
    if (!sale) return null

    applyCurrentYearIfMissing(text, sale)
    sale.companyId = user.companyId

    return { chatId, saleInput: sale }
  },

  // ---------------------------------------------------------------------
  // ✅ 2. PARSE PURCHASE
  // ---------------------------------------------------------------------
  async toPurchaseInput(update: TelegramUpdate, deps: { userRepository: UserRepository }): Promise<ParsedTelegramPurchase | null> {
    const message = update.message
    if (!message) return null

    const chatId = message.chat.id
    const user = await deps.userRepository.findByTelegramId(chatId)
    if (!user) return null

    const text = await this.getMessageText(message)
    if (!text) return null

    const purchase = await aiParsePurchase(text)
    if (!purchase) return null

    applyCurrentYearIfMissing(text, purchase)
    purchase.companyId = user.companyId

    return { chatId, purchaseInput: purchase }
  },

  // ---------------------------------------------------------------------
  // ✅ 3. PARSE PAYROLL (SOLO EMPLEADOS)
  // ---------------------------------------------------------------------
  async toPayrollInput(update: TelegramUpdate, deps: { userRepository: UserRepository }): Promise<ParsedTelegramPayroll | null> {
    const message = update.message
    if (!message) return null

    const chatId = message.chat.id
    const user = await deps.userRepository.findByTelegramId(chatId)
    if (!user) return null

    const text = await this.getMessageText(message)
    if (!text) return null

    const payroll = await aiParsePayroll(text)
    if (!payroll) return null // IA descarta talleres/tintorerías/etc.

    applyCurrentYearIfMissing(text, payroll)
    payroll.companyId = user.companyId

    return { chatId, payrollInput: payroll }
  },

  // ---------------------------------------------------------------------
  // ✅ 4. DETECTOR DE EVENTO (sale | purchase | payroll | income | unknown)
  // ---------------------------------------------------------------------
  async detectAndParse(update: TelegramUpdate, deps: { userRepository: UserRepository }): Promise<DetectedEvent | null> {
    const message = update.message
    const chatId = message?.chat?.id
    if (!message || !chatId) return null

    const user = await deps.userRepository.findByTelegramId(chatId)
    if (!user) {
      console.warn(`[Telegram] chatId sin usuario asignado: ${chatId}`)
      await TelegramClient.sendMessage({
        chatId,
        text: `No tienes un usuario asignado. Envia este ID a soporte: ${chatId}`,
      })
      return null
    }

    const text = await this.getMessageText(message)

    if (!text) return null

    const classification = await aiClassifyEvent(text)
    console.log('📊 Clasificación IA:', classification)

    // --- SALE ---
    if (classification === 'sale') {
      const result = await this.toSaleInput(update, deps)
      if (!result) return { type: 'sale_error', chatId }
      return { type: 'sale', chatId, data: result.saleInput }
    }

    // --- PURCHASE ---
    if (classification === 'purchase') {
      const result = await this.toPurchaseInput(update, deps)
      if (!result) return { type: 'purchase_error', chatId }
      return { type: 'purchase', chatId, data: result.purchaseInput }
    }

    // --- PAYROLL ---
    if (classification === 'payroll') {
      const result = await this.toPayrollInput(update, deps)
      if (!result) return { type: 'payroll_error', chatId }
      return { type: 'payroll', chatId, data: result.payrollInput }
    }

    // --- INCOME STATEMENT QUERY ---
    if (classification === 'income_statement_query') {
      const period = this.parseIncomeStatementPeriod(text)
      if (!period) return { type: 'income_statement_error', chatId }

      return {
        type: 'income_statement_query',
        chatId,
        companyId: user.companyId,
        period,
      }
    }

    // --- UNKNOWN ---
    return { type: 'unknown', chatId }
  },
}
