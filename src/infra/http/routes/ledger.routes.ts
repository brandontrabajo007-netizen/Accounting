// src/infra/http/routes/ledger.routes.ts

import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import { LedgerMovementMongoModel } from '@infra/persistence/mongo/models/LedgerMovementModel'
import express from 'express'
import { journalEntryRepository, ledgerBalanceRepository } from '../dependencies'

const router = express.Router()

// ---------------------------------------------------------
// 1) Obtener saldos reales por empresa
// GET /ledger/:companyId
// ---------------------------------------------------------
router.get('/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params

    const balances = await ledgerBalanceRepository.getAllByCompany(companyId)

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
// 2) Obtener movimientos contables reales (Ledger Movements)
// GET /ledger/movements/:companyId
// ---------------------------------------------------------
router.get('/movements/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params

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
