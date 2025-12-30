import { makeListAccountMovements } from '@application/accounts/use-cases/listAccountMovements'
import { makeListAccounts } from '@application/accounts/use-cases/listAccounts'
import express from 'express'
import { accountRepository, accountingPeriodRepository, ledgerMovementRepository } from '../dependencies'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

const listAccounts = makeListAccounts({ accountRepository })
const listAccountMovements = makeListAccountMovements({
  ledgerMovementRepository,
  accountRepository,
  accountingPeriodRepository,
})

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
    const includeRunningBalance = req.query.includeRunningBalance === 'false' ? false : true
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

export { router as accountRoutes }
