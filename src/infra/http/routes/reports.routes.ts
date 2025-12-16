// src/infra/http/routes/report.routes.ts

import { makeGenerateIncomeStatement } from '@application/reports/use-cases/generateIncomeStatement'
import express from 'express'
import { accountRepository, journalEntryRepository } from '../dependencies'

const router = express.Router()

// 🧠 Caso de uso: Estado de Resultados
const { generateIncomeStatement } = makeGenerateIncomeStatement({
  journalEntryRepository,
  accountRepository,
})

// 🌐 Endpoint GET /reports/income-statement?companyId=sahet
router.get('/income-statement', async (req, res) => {
  try {
    const companyId = req.query.companyId as string

    if (!companyId) {
      return res.status(400).json({
        status: false,
        error: 'companyId is required',
      })
    }

    const result = await generateIncomeStatement(companyId, {
      start: new Date(req.query.start as string),
      end: new Date(req.query.end as string),
    })

    return res.json({
      status: true,
      result,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error'

    return res.status(500).json({
      status: false,
      error: message,
    })
  }
})

export { router as reportRoutes }
