import type { PayrollEventInput } from '@application/eventos/Payroll/data/PayrollEventInput'
import { makeRegisterPayroll } from '@application/eventos/Payroll/use-case/registerPayroll'
import { type Request, type Response, Router } from 'express'
import { accountRepository, journalEntryRepository, payrollAccountMappingRepository, periodAccessGuard, processJournalEntry, resolvePeriodId } from '../dependencies'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Caso de uso inyectado
const { registerPayroll } = makeRegisterPayroll({
  accountRepository,
  journalEntryRepository,
  payrollAccountMappingRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
})

router.post('/payroll', authMiddleware, async (req: Request, res: Response) => {
  try {
    const body: PayrollEventInput = req.body

    const result = await registerPayroll(body)

    return res.status(201).json({
      status: true,
      journalEntry: result,
    })
  } catch (error: unknown) {
    console.error('❌ Error registrando nómina:', error)

    return res.status(400).json({
      status: false,
      error: (error as Error).message ?? 'Unexpected error',
    })
  }
})

export { router as payrollRoutes }
