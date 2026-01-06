import type { PayrollEventInput } from '@application/eventos/Payroll/data/PayrollEventInput'
import { makeRegisterPayroll } from '@application/eventos/Payroll/use-case/registerPayroll'
import type { PurchaseEventInput } from '@application/eventos/Purchase/data/PurchaseEventInput'
import { makeRegisterPurchase } from '@application/eventos/Purchase/use-cases/registerPurchase'
import type { SaleEventInput } from '@application/eventos/sales/data/SaleEventInput'
import { makeRegisterSale } from '@application/eventos/sales/use-cases/registerSale'
import { makeGenerateIncomeStatement } from '@application/reports/use-cases/generateIncomeStatement'
import { AccountingPeriodStatus } from '@domain/accounting-periods/AccountingPeriodStatus'
import type { Movement } from '@domain/movements'
import { TelegramAdapter } from '@infra/telegram/telegramAdapter'
import { TelegramClient } from '@infra/telegram/telegramClient'
import express, { type Request, type Response } from 'express'
import {
  accountingPeriodRepository,
  accountRepository,
  journalEntryRepository,
  payrollAccountMappingRepository,
  periodAccessGuard,
  processJournalEntry,
  purchaseAccountMappingRepository,
  resolvePeriodId,
  saleAccountMappingRepository,
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

const { generateIncomeStatement } = makeGenerateIncomeStatement({
  accountRepository,
  journalEntryRepository,
})

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const looksLikeAccountingEvent = (value: string) => {
  const text = normalizeText(value)
  return /\b(vendi|vendio|venta|compre|compra|pague|pago|nomina|salario|ingreso|estado de resultados|utilidad|ganancia|perdi|perdida)\b/.test(text)
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

router.post('/webhook', async (req: Request, res: Response) => {
  const update = req.body
  const chatId: number | null = update?.message?.chat?.id ?? null

  try {
    const rawText = await TelegramAdapter.getMessageText(update?.message)
    if (rawText && isGreetingOrHelp(rawText)) {
      if (!ensureChatId(chatId, res)) return
      await TelegramClient.sendMessage({
        chatId,
        text: helpMessage,
        parseMode: 'Markdown',
      })
      return res.status(200).json({ ok: true })
    }

    const detected = await TelegramAdapter.detectAndParse(update, {
      userRepository,
    })

    if (!detected) return res.status(200).json({ ok: true })

    // -----------------------------------------------------------------
    // VENTA
    // -----------------------------------------------------------------
    if (detected.type === 'sale') {
      try {
        const saleInput = { ...(detected.data as SaleEventInput), allowClosedReopen: true }
        const previousOpen = await accountingPeriodRepository.findOpenByCompany(saleInput.companyId)
        const result = await registerSale(saleInput)

        const entradas = result.movements.filter((m: Movement) => m.type === 'debit')
        const salidas = result.movements.filter((m: Movement) => m.type !== 'debit')

        const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')

        const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')

        const movementsText = []
        if (entradas.length > 0) movementsText.push(`Entradas 🟢:\n${entradasText}`)
        if (salidas.length > 0) movementsText.push(`Salidas 🔴:\n${salidasText}`)

        const movementsTextFinal = movementsText.join('\n\n')

        const isPending = result.status === 'pending'
        const statusIcon = isPending ? '⌛️' : '✅'
        const statusText = isPending ? '*Borrador guardado (Incompleto)*' : '*Venta registrada correctamente*'
        const periodLabel = await getPeriodLabel(saleInput.companyId, result.periodId)
        const summary = `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${saleInput.totalAmount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Completa los datos faltantes en el panel administrativo._' : ''}
        `.trim()

        if (!ensureChatId(chatId, res)) return

        await TelegramClient.sendMessage({
          chatId,
          text: summary,
          parseMode: 'Markdown',
        })

        if (previousOpen.length > 0 && previousOpen[0].id !== result.periodId) {
          await accountingPeriodRepository.markOpenExclusive(saleInput.companyId, previousOpen[0].id)
        }
        await markPeriodPendingIfReopened(saleInput.companyId, result.periodId)

        return res.status(200).json({ ok: true })
      } catch (err) {
        if (!ensureChatId(chatId, res)) return
        const message = err instanceof Error ? err.message : 'Error interno registrando la venta'
        await TelegramClient.sendMessage({ chatId, text: `No pude registrar la venta: ${message}` })
        return res.status(200).json({ ok: true })
      }
    }

    // -----------------------------------------------------------------
    // COMPRA
    // -----------------------------------------------------------------
    if (detected.type === 'purchase') {
      try {
        const purchaseInput = { ...(detected.data as PurchaseEventInput), allowClosedReopen: true }
        const previousOpen = purchaseInput.companyId ? await accountingPeriodRepository.findOpenByCompany(purchaseInput.companyId) : []

        const result = await registerPurchase(purchaseInput)

        const entradas = result.movements.filter((m) => m.type === 'debit')
        const salidas = result.movements.filter((m) => m.type !== 'debit')

        const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')

        const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')

        const movementsText = []
        if (entradas.length > 0) movementsText.push(`Entradas 🟢:\n${entradasText}`)
        if (salidas.length > 0) movementsText.push(`Salidas 🔴:\n${salidasText}`)

        const movementsTextFinal = movementsText.join('\n\n')

        const isPending = result.status === 'pending'
        const statusIcon = isPending ? '⌛️' : '✅'
        const statusText = isPending ? '*Borrador de Compra (Incompleto)*' : '*Compra registrada correctamente*'
        const periodLabel = purchaseInput.companyId ? await getPeriodLabel(purchaseInput.companyId, result.periodId) : 'no asignado'

        const summary = `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${purchaseInput.amount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Completa los detalles en el panel administrativo._' : ''}
        `.trim()

        if (!ensureChatId(chatId, res)) return

        await TelegramClient.sendMessage({
          chatId,
          text: summary,
          parseMode: 'Markdown',
        })

        if (purchaseInput.companyId && previousOpen.length > 0 && previousOpen[0].id !== result.periodId) {
          await accountingPeriodRepository.markOpenExclusive(purchaseInput.companyId, previousOpen[0].id)
        }
        if (purchaseInput.companyId) {
          await markPeriodPendingIfReopened(purchaseInput.companyId, result.periodId)
        }

        return res.status(200).json({ ok: true })
      } catch (err) {
        if (!ensureChatId(chatId, res)) return
        const message = err instanceof Error ? err.message : 'Error interno registrando la compra'
        await TelegramClient.sendMessage({ chatId, text: `No pude registrar la compra: ${message}` })
        return res.status(200).json({ ok: true })
      }
    }

    // -----------------------------------------------------------------
    // PAYROLL
    // -----------------------------------------------------------------
    if (detected.type === 'payroll') {
      try {
        const payrollInput = { ...(detected.data as PayrollEventInput), allowClosedReopen: true }
        const previousOpen = await accountingPeriodRepository.findOpenByCompany(payrollInput.companyId)

        const result = await registerPayroll(payrollInput)

        const entradas = result.movements.filter((m) => m.type === 'debit')
        const salidas = result.movements.filter((m) => m.type !== 'debit')

        const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')

        const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n')

        const movementsText = []
        if (entradas.length > 0) movementsText.push(`Entradas 🟢:\n${entradasText}`)
        if (salidas.length > 0) movementsText.push(`Salidas 🔴:\n${salidasText}`)

        const movementsTextFinal = movementsText.join('\n\n')

        const isPending = result.status === 'pending'
        const statusIcon = isPending ? '⌛️' : '✅'
        const statusText = isPending ? '*Borrador de Nomina (Incompleto)*' : '*Pago de nomina registrado*'
        const periodLabel = await getPeriodLabel(payrollInput.companyId, result.periodId)

        const summary = `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${payrollInput.amount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Recuerda completar la informacion en el panel._' : ''}
        `.trim()

        if (!ensureChatId(chatId, res)) return

        await TelegramClient.sendMessage({
          chatId,
          text: summary,
          parseMode: 'Markdown',
        })

        if (previousOpen.length > 0 && previousOpen[0].id !== result.periodId) {
          await accountingPeriodRepository.markOpenExclusive(payrollInput.companyId, previousOpen[0].id)
        }
        await markPeriodPendingIfReopened(payrollInput.companyId, result.periodId)

        return res.status(200).json({ ok: true })
      } catch (err) {
        if (!ensureChatId(chatId, res)) return
        const message = err instanceof Error ? err.message : 'Error interno registrando la nomina'
        await TelegramClient.sendMessage({ chatId, text: `No pude registrar la nomina: ${message}` })
        return res.status(200).json({ ok: true })
      }
    }

    // -----------------------------------------------------------------
    // CONSULTA ESTADO DE RESULTADOS RÁPIDO (hoy/semana/mes)
    // -----------------------------------------------------------------
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
No reconozco si tu mensaje es venta, compra o pago de nomina.

Venta:
"Vendi 10 pantalones a 50.000 me cuesta 36.000"

Compra:
"Compre cremalleras por 300.000 sin IVA en efectivo"

Nomina:
"pague nomina 500000 por banco"
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
