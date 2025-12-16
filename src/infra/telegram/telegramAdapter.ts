import { aiClassifyEvent } from '@application/parsers/aiEventClassifier'
import { aiParsePurchase } from '@application/parsers/aiParsePurchase'
import { aiParsePayroll } from '@application/parsers/aiPayrollParser'
import { aiParseSale } from '@application/parsers/aiSaleParser'

import type { UserRepository } from '@application/shared/ports/UserRepository'
import { TelegramClient } from './telegramClient'

import type { ParsedTelegramPayroll, ParsedTelegramPurchase, ParsedTelegramSale, TelegramUpdate } from './telegramTypes'

export const TelegramAdapter = {
  // ---------------------------------------------------------------------
  // 🟦 1. PARSE SALE
  // ---------------------------------------------------------------------
  async toSaleInput(update: TelegramUpdate, deps: { userRepository: UserRepository }): Promise<ParsedTelegramSale | null> {
    const message = update.message
    if (!message) return null

    const chatId = message.chat.id
    const user = await deps.userRepository.findByTelegramId(chatId)
    if (!user) return null

    let text: string | null = message.text?.trim() ?? null
    const voice = message.voice ?? message.audio

    if (!text && voice) {
      try {
        const file = await TelegramClient.getFileDownloadUrl(voice.file_id)
        const transcript = await TelegramClient.transcribeAudio(file)
        if (!transcript) return null
        text = transcript.trim()
      } catch {
        return null
      }
    }

    if (!text) return null

    const sale = await aiParseSale(text)
    if (!sale) return null

    sale.companyId = user.companyId

    return { chatId, saleInput: sale }
  },

  // ---------------------------------------------------------------------
  // 🟩 2. PARSE PURCHASE
  // ---------------------------------------------------------------------
  async toPurchaseInput(update: TelegramUpdate, deps: { userRepository: UserRepository }): Promise<ParsedTelegramPurchase | null> {
    const message = update.message
    if (!message) return null

    const chatId = message.chat.id
    const user = await deps.userRepository.findByTelegramId(chatId)
    if (!user) return null

    let text: string | null = message.text?.trim() ?? null
    const voice = message.voice ?? message.audio

    if (!text && voice) {
      try {
        const file = await TelegramClient.getFileDownloadUrl(voice.file_id)
        const transcript = await TelegramClient.transcribeAudio(file)
        if (!transcript) return null
        text = transcript.trim()
      } catch {
        return null
      }
    }

    if (!text) return null

    const purchase = await aiParsePurchase(text)
    if (!purchase) return null

    purchase.companyId = user.companyId

    return { chatId, purchaseInput: purchase }
  },

  // ---------------------------------------------------------------------
  // 🟪 3. PARSE PAYROLL (SOLO EMPLEADOS)
  // ---------------------------------------------------------------------
  async toPayrollInput(update: TelegramUpdate, deps: { userRepository: UserRepository }): Promise<ParsedTelegramPayroll | null> {
    const message = update.message
    if (!message) return null

    const chatId = message.chat.id
    const user = await deps.userRepository.findByTelegramId(chatId)
    if (!user) return null

    let text: string | null = message.text?.trim() ?? null
    const voice = message.voice ?? message.audio

    if (!text && voice) {
      try {
        const file = await TelegramClient.getFileDownloadUrl(voice.file_id)
        const transcript = await TelegramClient.transcribeAudio(file)
        if (!transcript) return null
        text = transcript.trim()
      } catch {
        return null
      }
    }

    if (!text) return null

    const payroll = await aiParsePayroll(text)
    if (!payroll) return null // IA descarta talleres/tintorerías/etc.

    payroll.companyId = user.companyId

    return { chatId, payrollInput: payroll }
  },

  // ---------------------------------------------------------------------
  // 🟧 4. DETECTOR DE EVENTO (sale | purchase | payroll | unknown)
  // ---------------------------------------------------------------------
  async detectAndParse(update: TelegramUpdate, deps: { userRepository: UserRepository }) {
    const text = update.message?.text ?? null
    const chatId = update.message?.chat?.id

    if (!text || !chatId) return null

    const classification = await aiClassifyEvent(text)
    console.log('🔍 Clasificación IA:', classification)

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

    // --- UNKNOWN ---
    return { type: 'unknown', chatId }
  },
}
