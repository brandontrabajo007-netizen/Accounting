import { makeAttemptCloseAccountingPeriod } from '@application/accounting-periods/use-cases/attemptCloseAccountingPeriod'
import { makeCloseAccountingPeriod } from '@application/accounting-periods/use-cases/closeAccountingPeriod'
import { makeCreateAccountingPeriod } from '@application/accounting-periods/use-cases/createAccountingPeriod'
import { makeListAccountingPeriods } from '@application/accounting-periods/use-cases/listAccountingPeriods'
import { makeOpenAccountingPeriod } from '@application/accounting-periods/use-cases/openAccountingPeriod'
import express from 'express'
import { accountingPeriodRepository, accountRepository, domainEventBus, journalEntryRepository, ledgerSnapshotRepository, periodResultRepository, transactionRunner } from '../dependencies'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

const attemptCloseAccountingPeriod = makeAttemptCloseAccountingPeriod({
  accountingPeriodRepository,
  journalEntryRepository,
})
const closeAccountingPeriod = makeCloseAccountingPeriod({
  accountingPeriodRepository,
  journalEntryRepository,
  periodResultRepository,
  domainEventBus,
  transactionRunner,
  accountRepository,
})
const createAccountingPeriod = makeCreateAccountingPeriod({ accountingPeriodRepository })
const listAccountingPeriods = makeListAccountingPeriods({ accountingPeriodRepository })
const openAccountingPeriod = makeOpenAccountingPeriod({ accountingPeriodRepository })

router.post('/accounting-periods/attempt-close', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })
    const { periodId } = req.body
    if (typeof periodId !== 'string' || !periodId) return res.status(400).json({ status: false, error: 'periodId requerido' })

    const result = await attemptCloseAccountingPeriod.execute(req.user.companyId, periodId)
    return res.json({ status: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.post('/accounting-periods/close', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })
    const { periodId } = req.body
    if (typeof periodId !== 'string' || !periodId) return res.status(400).json({ status: false, error: 'periodId requerido' })

    await closeAccountingPeriod.execute(req.user.companyId, periodId)

    return res.status(200).json({ status: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.post('/accounting-periods', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })
    const { startDate, endDate, name } = req.body

    if (typeof startDate !== 'string' || typeof endDate !== 'string') {
      return res.status(400).json({ status: false, error: 'startDate y endDate son obligatorios' })
    }

    const period = await createAccountingPeriod.execute({
      companyId: req.user.companyId,
      startDate,
      endDate,
      name,
    })

    return res.status(201).json({
      status: true,
      period: {
        id: period.id,
        label: period.name ?? period.id,
        status: period.status,
        start: period.start,
        end: period.end,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/accounting-periods', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const periods = await listAccountingPeriods.execute(req.user.companyId)

    return res.json({
      status: true,
      items: periods.map((p) => ({
        id: p.id,
        label: p.name ?? p.id,
        status: p.status,
        start: p.start,
        end: p.end,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.post('/accounting-periods/:id/open', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })
    const { id } = req.params
    const period = await openAccountingPeriod.execute(req.user.companyId, id)
    return res.json({
      status: true,
      period: {
        id: period.id,
        label: period.name ?? period.id,
        status: period.status,
        start: period.start,
        end: period.end,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/accounting-periods/:id/result', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })
    const { id } = req.params
    const companyId = req.user.companyId

    const [result, ledgerSnapshot] = await Promise.all([periodResultRepository.findByPeriod(companyId, id), ledgerSnapshotRepository.findByPeriod(companyId, id)])

    if (!result && !ledgerSnapshot) {
      return res.status(404).json({ status: false, error: 'Resultado no encontrado para el periodo' })
    }

    return res.json({
      status: true,
      periodId: id,
      result,
      ledgerSnapshot,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

export { router as accountingPeriodRoutes }
