// src/infra/http/routes/ledger.routes.ts

import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import express from 'express'
import { LedgerMovementMongoModel } from '@infra/persistence/mongo/models/LedgerMovementModel'
import { accountRepository, journalEntryRepository } from '../dependencies'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

// ---------------------------------------------------------
// 1) Obtener saldos reales por empresa
// GET /ledger/:companyId
// ---------------------------------------------------------
router.get('/', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.companyId

    const accounts = await accountRepository.getAll()
    const balances = accounts.map((account) => ({
      accountCode: account.code,
      accountName: account.name,
      balance: account.currentBalanceByCompany?.[companyId] ?? 0,
    }))

    return res.json({
      status: 'ok',
      companyId,
      balances,
    })
  } catch (err) {
    console.error('Error getting ledger balances:', err)
    return res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }
})

// ---------------------------------------------------------
// 1.1) Resetear saldos contables por empresa (solo pruebas)
// POST /ledger/reset-balances
// ---------------------------------------------------------
router.post('/reset-balances', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.companyId
    const rawAccountCodes = req.body?.accountCodes
    const accountCodes = Array.isArray(rawAccountCodes)
      ? rawAccountCodes
          .map(Number)
          .filter((code) => Number.isFinite(code))
      : undefined

    await accountRepository.resetBalances(companyId, accountCodes)

    return res.json({
      status: 'ok',
      companyId,
      resetAccounts: accountCodes ?? 'all',
    })
  } catch (err) {
    console.error('Error resetting ledger balances:', err)
    return res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }
})

// ---------------------------------------------------------
// 2) Obtener movimientos contables reales (Ledger Movements)
// GET /ledger/movements/:companyId
// ---------------------------------------------------------
router.get('/movements/:companyId', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })
    const { companyId } = req.params
    if (companyId !== req.user.companyId) return res.status(403).json({ status: false, error: 'Acceso denegado' })

    const movements = await LedgerMovementMongoModel.find({ companyId }).sort({ date: -1 }).lean()

    return res.json({
      status: 'ok',
      companyId,
      movements,
    })
  } catch (err) {
    console.error('Error getting ledger movements:', err)
    return res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }
})

// ---------------------------------------------------------
// 3) Listar solo Journal Entries en estado PROCESSED
// GET /journal/processed/:companyId
// ---------------------------------------------------------
router.get('/journal/processed/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params

    const entries = await journalEntryRepository.findByStatus(companyId, JournalEntryStatus.PROCESSED)

    return res.json({
      status: 'ok',
      companyId,
      processedEntries: entries,
    })
  } catch (err) {
    console.error('Error getting processed journal entries:', err)
    return res.status(500).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }
})

export { router as ledgerRoutes }
