import { randomUUID } from 'node:crypto'
import { makeListAccountMovements } from '@application/accounts/use-cases/listAccountMovements'
import { makeListAccounts } from '@application/accounts/use-cases/listAccounts'
import { AccountType } from '@domain/accounts/AccountType'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { MovementGroup } from '@domain/movements/Movement'
import { MovementStatus } from '@domain/movements/MovementStatus'
import { TransactionTypes } from '@domain/movements/TransactionType'
import express from 'express'
import { accountingPeriodRepository, accountRepository, ledgerMovementRepository, processJournalEntry } from '../dependencies'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

const listAccounts = makeListAccounts({ accountRepository })
const listAccountMovements = makeListAccountMovements({
  ledgerMovementRepository,
  accountRepository,
  accountingPeriodRepository,
})

const defaultOffsetAccountCode = Number(process.env.EQUITY_ACCOUNT_CODE ?? 3605)

const parseDate = (value: unknown): Date | undefined | null => {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

router.get('/accounts', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const items = await listAccounts.execute(req.user.companyId)

    return res.json({
      status: true,
      items,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/accounts/:accountCode/movements', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const accountCode = Number(req.params.accountCode)
    if (!Number.isFinite(accountCode)) {
      return res.status(400).json({ status: false, error: 'accountCode inválido' })
    }

    const page = Number(req.query.page ?? 1)
    const limit = Number(req.query.limit ?? 50)
    const includeRunningBalance = req.query.includeRunningBalance !== 'false'
    const periodId = typeof req.query.periodId === 'string' ? req.query.periodId : undefined

    const from = parseDate(req.query.from)
    if (from === null) return res.status(400).json({ status: false, error: 'from inválido' })

    const to = parseDate(req.query.to)
    if (to === null) return res.status(400).json({ status: false, error: 'to inválido' })

    const result = await listAccountMovements.execute({
      companyId: req.user.companyId,
      accountCode,
      periodId,
      from: from ?? undefined,
      to: to ?? undefined,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 50,
      includeRunningBalance,
    })

    return res.json({
      status: true,
      ...result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.post('/accounts/:accountCode/balance', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const accountCode = Number(req.params.accountCode)
    if (!Number.isFinite(accountCode)) {
      return res.status(400).json({ status: false, error: 'accountCode inválido' })
    }

    const value = Number(req.body?.value)
    if (!Number.isFinite(value)) {
      return res.status(400).json({ status: false, error: 'value inválido' })
    }

    const offsetAccountCode = Number(req.body?.offsetAccountCode ?? defaultOffsetAccountCode)
    if (!Number.isFinite(offsetAccountCode)) {
      return res.status(400).json({ status: false, error: 'offsetAccountCode inválido o faltante' })
    }

    const companyId = req.user.companyId
    const [targetAccount, offsetAccount, currentBalance] = await Promise.all([
      accountRepository.getByCode(accountCode),
      accountRepository.getByCode(offsetAccountCode),
      accountRepository.getBalance(companyId, accountCode),
    ])

    const delta = value - currentBalance
    if (delta === 0) {
      return res.json({ status: true, accountCode, value, message: 'Saldo ya coincide, no se realizaron movimientos' })
    }

    const increaseIsDebit = targetAccount.type === AccountType.ASSET || targetAccount.type === AccountType.EXPENSE
    const targetMovementType = delta > 0 ? (increaseIsDebit ? TransactionTypes.DEBIT : TransactionTypes.CREDIT) : increaseIsDebit ? TransactionTypes.CREDIT : TransactionTypes.DEBIT

    const adjustmentAmount = Math.abs(delta)
    const offsetMovementType = targetMovementType === TransactionTypes.DEBIT ? TransactionTypes.CREDIT : TransactionTypes.DEBIT

    const description = typeof req.body?.description === 'string' && req.body.description.trim() ? req.body.description.trim() : `Ajuste manual de saldo cuenta ${accountCode}`

    const journalEntry = {
      id: randomUUID(),
      companyId,
      date: new Date(),
      description,
      status: JournalEntryStatus.CREATED,
      movements: [
        {
          accountCode,
          accountName: targetAccount.name,
          type: targetMovementType,
          amount: adjustmentAmount,
          status: MovementStatus.PROCESSED,
          group: 'MAIN' as MovementGroup,
        },
        {
          accountCode: offsetAccountCode,
          accountName: offsetAccount.name,
          type: offsetMovementType,
          amount: adjustmentAmount,
          status: MovementStatus.PROCESSED,
          group: 'MAIN' as MovementGroup,
        },
      ],
    }

    const processedEntry = await processJournalEntry.processEntry(journalEntry, null)

    return res.json({
      status: true,
      accountCode,
      value,
      delta,
      journalEntryId: processedEntry.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

export { router as accountRoutes }
