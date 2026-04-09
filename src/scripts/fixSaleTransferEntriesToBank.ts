import { connectToMongo } from '../infra/persistence/mongo/connect'
import { processJournalEntry } from '../infra/http/dependencies'
import { EventType } from '../domain/events/EventType.enum'
import type { JournalEntry } from '../domain/journal-entries/JournalEntry'
import { JournalEntryModel } from '../infra/persistence/mongo/models/journalEntry.model'
import { SaleAccountMappingModel } from '../infra/persistence/mongo/models/saleAccountMapping.model'
import { AccountModel } from '../infra/persistence/mongo/models/account.model'
import { CustomerHistoryMongoModel } from '../accounts-receivable/infrastructure/persistence/mongo/models/CustomerHistoryModel'

type Args = {
  companyId: string
  from?: Date
  to?: Date
  apply: boolean
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const hasBankKeyword = (value: string | null | undefined): boolean => {
  if (!value) return false
  const text = normalize(value)
  return /(banco|transferencia|transfer|tarjeta|nequi|daviplata|pse)/.test(text)
}

const parseDateOnly = (value: string, bound: 'from' | 'to'): Date => {
  const raw = value.trim()
  const withTime = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? bound === 'from'
      ? `${raw}T00:00:00.000Z`
      : `${raw}T23:59:59.999Z`
    : raw
  const date = new Date(withTime)
  if (Number.isNaN(date.getTime())) throw new Error(`Fecha invalida: ${value}`)
  return date
}

const readArgs = (): Args => {
  const args = process.argv.slice(2)
  const byKey = new Map<string, string>()
  let apply = false

  for (const arg of args) {
    if (arg === '--apply') {
      apply = true
      continue
    }
    const match = arg.match(/^--([^=]+)=(.+)$/)
    if (match) byKey.set(match[1], match[2])
  }

  const companyId = byKey.get('companyId')?.trim()
  if (!companyId) {
    throw new Error('Falta --companyId=<id_empresa>')
  }

  const from = byKey.get('from') ? parseDateOnly(byKey.get('from') as string, 'from') : undefined
  const to = byKey.get('to') ? parseDateOnly(byKey.get('to') as string, 'to') : undefined

  if (from && to && to < from) {
    throw new Error('Rango invalido: --to debe ser mayor o igual a --from')
  }

  return { companyId, from, to, apply }
}

const loadTransferSaleEntryIdsFromCustomerHistory = async (companyId: string, from?: Date, to?: Date): Promise<Set<string>> => {
  const filter: Record<string, unknown> = {
    companyId,
    type: 'sale',
    journalEntryId: { $exists: true, $ne: null },
  }

  if (from || to) {
    const dateFilter: { $gte?: Date; $lte?: Date } = {}
    if (from) dateFilter.$gte = from
    if (to) dateFilter.$lte = to
    filter.date = dateFilter
  }

  const docs = await CustomerHistoryMongoModel.find(filter).select({ journalEntryId: 1, paymentMethod: 1 }).lean().exec()
  const ids = new Set<string>()
  for (const doc of docs) {
    const paymentMethod = typeof doc.paymentMethod === 'string' ? doc.paymentMethod : null
    const journalEntryId = typeof doc.journalEntryId === 'string' ? doc.journalEntryId.trim() : ''
    if (!journalEntryId) continue
    if (hasBankKeyword(paymentMethod)) {
      ids.add(journalEntryId)
    }
  }
  return ids
}

const run = async () => {
  const args = readArgs()
  await connectToMongo()

  const mapping = await SaleAccountMappingModel.findOne({ companyId: args.companyId }).lean().exec()
  if (!mapping) throw new Error(`No existe SaleAccountMapping para companyId "${args.companyId}"`)

  const cashAccount = Number(mapping.cashAccount ?? 0)
  const bankAccount = Number(mapping.bankAccount ?? 0)
  if (!cashAccount) throw new Error('SaleAccountMapping.cashAccount es requerido')
  if (!bankAccount) throw new Error('SaleAccountMapping.bankAccount es requerido para esta correccion')
  if (cashAccount === bankAccount) throw new Error('cashAccount y bankAccount no pueden ser iguales')

  const bankAccountDoc = await AccountModel.findOne({ code: bankAccount }).select({ name: 1 }).lean().exec()
  if (!bankAccountDoc?.name) throw new Error(`No existe cuenta contable para bankAccount=${bankAccount}`)
  const bankAccountName = String(bankAccountDoc.name)

  const transferByHistory = await loadTransferSaleEntryIdsFromCustomerHistory(args.companyId, args.from, args.to)

  const query: Record<string, unknown> = {
    companyId: args.companyId,
    eventType: EventType.SALE,
  }
  if (args.from || args.to) {
    const dateFilter: { $gte?: Date; $lte?: Date } = {}
    if (args.from) dateFilter.$gte = args.from
    if (args.to) dateFilter.$lte = args.to
    query.date = dateFilter
  }

  const entries = await JournalEntryModel.find(query).sort({ date: 1 }).lean().exec()

  let reviewed = 0
  let candidates = 0
  let updated = 0
  let skippedClosed = 0
  let skippedNoEvidence = 0
  let skippedNoCashMovement = 0

  for (const rawEntry of entries) {
    reviewed += 1
    const entry = rawEntry as unknown as JournalEntry

    const entryId = String(entry.id ?? '').trim()
    if (!entryId) continue

    const byHistory = transferByHistory.has(entryId)
    const byDescription = hasBankKeyword(entry.description)
    const isTransferLike = byHistory || byDescription
    if (!isTransferLike) {
      skippedNoEvidence += 1
      continue
    }

    const nextMovements = entry.movements.map((movement) => {
      const shouldMoveToBank =
        movement.accountCode === cashAccount &&
        movement.type === 'debit' &&
        movement.amount > 0 &&
        (movement.group === 'REVENUE' || movement.group === 'MAIN')

      if (!shouldMoveToBank) return movement
      return {
        ...movement,
        accountCode: bankAccount,
        accountName: bankAccountName,
      }
    })

    const changed = nextMovements.some((m, index) => m.accountCode !== entry.movements[index].accountCode)
    if (!changed) {
      skippedNoCashMovement += 1
      continue
    }

    candidates += 1

    if (!args.apply) continue

    const updatedEntry: JournalEntry = {
      ...entry,
      movements: nextMovements,
    }

    try {
      await processJournalEntry.processEntry(updatedEntry, entry)
      updated += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (/period/i.test(message) && /open|cerrado|closed/i.test(message)) {
        skippedClosed += 1
        continue
      }
      throw new Error(`Error corrigiendo asiento ${entryId}: ${message}`)
    }
  }

  console.log('--- Resultado ---')
  console.log(`Empresa: ${args.companyId}`)
  console.log(`Rango: ${args.from ? args.from.toISOString() : 'sin limite'} -> ${args.to ? args.to.toISOString() : 'sin limite'}`)
  console.log(`Modo: ${args.apply ? 'APPLY' : 'DRY RUN'}`)
  console.log(`Asientos revisados: ${reviewed}`)
  console.log(`Candidatos detectados: ${candidates}`)
  console.log(`Actualizados: ${updated}`)
  console.log(`Saltados por periodo cerrado: ${skippedClosed}`)
  console.log(`Saltados sin evidencia de transferencia: ${skippedNoEvidence}`)
  console.log(`Saltados sin debito en caja para mover: ${skippedNoCashMovement}`)
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Error: ${message}`)
    process.exit(1)
  })
