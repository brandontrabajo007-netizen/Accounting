import type { PayrollEventInput } from '@application/eventos/Payroll/data/PayrollEventInput'
import { makeRegisterPayroll } from '@application/eventos/Payroll/use-case/registerPayroll'
import type { PurchaseEventInput } from '@application/eventos/Purchase/data/PurchaseEventInput'
import { makeRegisterPurchase } from '@application/eventos/Purchase/use-cases/registerPurchase'
import type { SaleEventInput } from '@application/eventos/sales/data/SaleEventInput'
import { makeRegisterSale } from '@application/eventos/sales/use-cases/registerSale'

import type { Movement } from '@domain/movements'

// Telegram
import { TelegramAdapter } from '@infra/telegram/telegramAdapter'
import { TelegramClient } from '@infra/telegram/telegramClient'

// Express
import express, { type Request, type Response } from 'express'

// Repositorios
import {
  accountRepository,
  journalEntryRepository,
  payrollAccountMappingRepository,
  processJournalEntry,
  purchaseAccountMappingRepository,
  saleAccountMappingRepository,
  userRepository,
  periodAccessGuard,
  resolvePeriodId,
} from '../dependencies'

const router = express.Router()

// Casos de uso
const { registerSale } = makeRegisterSale({
  accountRepository,
  journalEntryRepository,
  saleAccountMappingRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
})

const { registerPurchase } = makeRegisterPurchase({
  accountRepository,
  journalEntryRepository,
  purchaseAccountMappingRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
})

const { registerPayroll } = makeRegisterPayroll({
  accountRepository,
  journalEntryRepository,
  payrollAccountMappingRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
})

/* ---------------------------------------------------------
   🔧 Helper: validar chatId
--------------------------------------------------------- */
function ensureChatId(chatId: number | null, res: Response): chatId is number {
  if (!chatId) {
    console.error('❌ No chatId found, no puedo enviar respuesta')
    res.status(200).json({ ok: true })
    return false
  }
  return true
}

/* ---------------------------------------------------------
   📌 WEBHOOK PRINCIPAL TELEGRAM
--------------------------------------------------------- */
router.post('/webhook', async (req: Request, res: Response) => {
  const update = req.body
  const chatId: number | null = update?.message?.chat?.id ?? null

  try {
    const detected = await TelegramAdapter.detectAndParse(update, {
      userRepository,
    })

    if (!detected) return res.status(200).json({ ok: true })

    /* ---------------------------------------------------------
       🟦 CASO 1: VENTA
    --------------------------------------------------------- */
    if (detected.type === 'sale') {
      const saleInput = detected.data as SaleEventInput

      const result = await registerSale(saleInput)

      const movementsText = result.movements
        .map((m: Movement) => {
          const side = m.type === 'debit' ? '🔺 Debe' : '🔻 Haber'
          return `${side} *${m.accountName}:* ${m.amount}`
        })
        .join('\n')

      const isPending = result.status === 'pending'
      const statusIcon = isPending ? '⚠️' : '✅'
      const statusText = isPending ? '*Borrador guardado (Incompleto)*' : '*Venta registrada correctamente*'

      const summary = `
${statusIcon} ${statusText}

*Descripción:* ${result.description}
*Total:* ${saleInput.totalAmount}

*Movimientos contables:*
${movementsText}

${isPending ? '_Completa los datos faltantes en el panel administrativo._' : ''}
      `.trim()

      if (!ensureChatId(chatId, res)) return

      await TelegramClient.sendMessage({
        chatId,
        text: summary,
        parseMode: 'Markdown',
      })

      return res.status(200).json({ ok: true })
    }

    /* ---------------------------------------------------------
       🟩 CASO 2: COMPRA
    --------------------------------------------------------- */
    if (detected.type === 'purchase') {
      const purchaseInput = detected.data as PurchaseEventInput

      const result = await registerPurchase(purchaseInput)

      const movementsText = result.movements
        .map((m) => {
          const side = m.type === 'debit' ? '🔺 Debe' : '🔻 Haber'
          return `${side} *${m.accountName}:* ${m.amount}`
        })
        .join('\n')

      const isPending = result.status === 'pending'
      const statusIcon = isPending ? '⚠️' : '✅'
      const statusText = isPending ? '*Borrador de Compra (Incompleto)*' : '*Compra registrada correctamente*'

      const summary = `
${statusIcon} ${statusText}

*Descripción:* ${result.description}
*Total:* ${purchaseInput.amount}

*Movimientos contables:*
${movementsText}

${isPending ? '_Completa los detalles en el panel administrativo._' : ''}
      `.trim()

      if (!ensureChatId(chatId, res)) return

      await TelegramClient.sendMessage({
        chatId,
        text: summary,
        parseMode: 'Markdown',
      })

      return res.status(200).json({ ok: true })
    }

    /* ---------------------------------------------------------
       🟨 CASO 3: PAYROLL — Nómina / Mano de obra
    --------------------------------------------------------- */
    if (detected.type === 'payroll') {
      const payrollInput = detected.data as PayrollEventInput

      const result = await registerPayroll(payrollInput)

      const movementsText = result.movements
        .map((m) => {
          const side = m.type === 'debit' ? '🔺 Debe' : '🔻 Haber'
          return `${side} *${m.accountName}:* ${m.amount}`
        })
        .join('\n')

      const isPending = result.status === 'pending'
      const statusIcon = isPending ? '⚠️' : '✅'
      const statusText = isPending ? '*Borrador de Nómina (Incompleto)*' : '*Pago de nómina registrado*'

      const summary = `
${statusIcon} ${statusText}

*Descripción:* ${result.description}
*Total:* ${payrollInput.amount}

*Movimientos contables:*
${movementsText}

${isPending ? '_Recuerda completar la información en el panel._' : ''}
      `.trim()

      if (!ensureChatId(chatId, res)) return

      await TelegramClient.sendMessage({
        chatId,
        text: summary,
        parseMode: 'Markdown',
      })

      return res.status(200).json({ ok: true })
    }

    /* ---------------------------------------------------------
       🟥 ERROR VENTA
    --------------------------------------------------------- */
    if (detected.type === 'sale_error') {
      if (!ensureChatId(chatId, res)) return

      await TelegramClient.sendMessage({
        chatId,
        text: `
❗ No logré entender la venta.  
Debes indicar cantidad, producto, precio, costo y si incluye IVA.
        `.trim(),
        parseMode: 'Markdown',
      })

      return res.status(200).json({ ok: true })
    }

    /* ---------------------------------------------------------
       🟧 ERROR COMPRA
    --------------------------------------------------------- */
    if (detected.type === 'purchase_error') {
      if (!ensureChatId(chatId, res)) return

      await TelegramClient.sendMessage({
        chatId,
        text: `
❗ No logré entender la compra.  
Ejemplo: "Compré tela por 700.000 sin IVA, pagado por banco, es insumo".
        `.trim(),
        parseMode: 'Markdown',
      })

      return res.status(200).json({ ok: true })
    }

    /* ---------------------------------------------------------
       🟨 ERROR PAYROLL
    --------------------------------------------------------- */
    if (detected.type === 'payroll_error') {
      if (!ensureChatId(chatId, res)) return

      await TelegramClient.sendMessage({
        chatId,
        text: `
❗ No logré entender el pago de nómina.  
Ejemplos:  
• pagué nómina 500000 por banco  
• pagué empleados 700000 en efectivo  
        `.trim(),
        parseMode: 'Markdown',
      })

      return res.status(200).json({ ok: true })
    }

    /* ---------------------------------------------------------
       ❓ MENSAJE NO CLASIFICADO
    --------------------------------------------------------- */
    if (detected.type === 'unknown') {
      if (!ensureChatId(chatId, res)) return

      await TelegramClient.sendMessage({
        chatId,
        text: `
No reconozco si tu mensaje es *venta*, *compra* o *pago de nómina*.

💰 Venta:
"Vendí 10 pantalones a 50.000 me cuesta 36.000"

🧾 Compra:
"Compré cremalleras por 300.000 sin IVA en efectivo"

👥 Nómina:
"pagué nómina 500000 por banco"
        `.trim(),
        parseMode: 'Markdown',
      })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('❌ Error manejando webhook:', error)

    if (ensureChatId(chatId, res)) {
      TelegramClient.sendMessage({
        chatId,
        text: '❌ Error interno procesando tu mensaje.',
      })
    }

    return res.status(200).json({ ok: true })
  }
})

export { router as telegramRoutes }
