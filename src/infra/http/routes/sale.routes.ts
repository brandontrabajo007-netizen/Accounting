import { makeRegisterSale } from '@application/eventos/sales/use-cases/registerSale'
import express from 'express'
import { accountRepository, journalEntryRepository, periodAccessGuard, processJournalEntry, saleAccountMappingRepository, resolvePeriodId } from '../dependencies'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

const { registerSale } = makeRegisterSale({
  accountRepository,
  saleAccountMappingRepository,
  journalEntryRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
})

// dYs? REGISTRAR VENTA (PROTEGIDO CON JWT)
router.post('/sale', authMiddleware, async (req, res) => {
  try {
    const body = req.body

    // dY`Ø Guard para que TS y Biome estén felices
    if (!req.user) {
      return res.status(500).json({
        status: false,
        error: 'Usuario autenticado no encontrado en la petición',
      })
    }

    const companyId = req.user.companyId

    const result = await registerSale({
      description: body.description,
      totalAmount: body.totalAmount,
      date: body.date,
      includesVAT: body.includesVAT,
      includesCost: body.includesCost,
      quantity: body.quantity,
      unitCost: body.unitCost,
      unitPrice: body.unitPrice,
      companyId, // siempre del token
      periodId: body.periodId,
    })

    return res.status(201).json({
      status: true,
      journalEntry: result,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error'

    return res.status(400).json({
      status: false,
      error: message,
    })
  }
})

export { router as saleRoutes }
