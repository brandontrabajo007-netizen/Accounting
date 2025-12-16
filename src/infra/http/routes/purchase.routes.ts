import { makeRegisterPurchase } from '@application/eventos/Purchase/use-cases/registerPurchase'
import express from 'express'
import { accountRepository, journalEntryRepository, processJournalEntry, purchaseAccountMappingRepository } from '../dependencies'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

const { registerPurchase } = makeRegisterPurchase({
  accountRepository,
  purchaseAccountMappingRepository,
  journalEntryRepository,
  processJournalEntry,
})

router.post('/purchase', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({
        status: false,
        error: 'Usuario no autenticado o sin companyId',
      })
    }

    const companyId = req.user.companyId
    const body = req.body

    const result = await registerPurchase({
      description: body.description,
      amount: body.amount,
      includesVAT: body.includesVAT,
      debitAccount: body.debitAccount,
      paymentMethod: body.paymentMethod,
      supplier: body.supplier,
      date: body.date,
      companyId, // <-- viene del token
    })

    return res.status(201).json({
      status: true,
      journalEntry: result,
    })
  } catch (error: unknown) {
    return res.status(400).json({
      status: false,
      error: (error as Error).message ?? 'Unexpected error',
    })
  }
})

export { router as purchaseRoutes }
