import { makeGenerateAndSaveIncomeStatement } from '@application/reports/use-cases/generateAndSaveIncomeStatement'
import { makeGenerateIncomeStatement } from '@application/reports/use-cases/generateIncomeStatement'
import express from 'express'
import { accountRepository, incomeStatementRepository } from '../dependencies'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

/* ======================================================
   Casos de uso
====================================================== */

const { generateIncomeStatement } = makeGenerateIncomeStatement({
  accountRepository,
})

const { execute: generateAndSaveIncomeStatement } = makeGenerateAndSaveIncomeStatement({
  accountRepository,
  incomeStatementRepository,
})

/* ======================================================
   📊 PREVIEW (NO guarda)
   GET /reports/income-statement?start=YYYY-MM-DD&end=YYYY-MM-DD
====================================================== */

router.get('/income-statement', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        error: 'No autenticado',
      })
    }

    const { start, end } = req.query

    if (typeof start !== 'string' || typeof end !== 'string') {
      return res.status(400).json({
        status: false,
        error: 'start y end son obligatorios',
      })
    }

    const result = await generateIncomeStatement(
      req.user.companyId,
      { start, end }, // 👈 STRINGS
    )

    return res.json({
      status: true,
      result,
    })
  } catch (error: unknown) {
    return res.status(500).json({
      status: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

/* ======================================================
   💾 GENERAR + GUARDAR (snapshot)
   POST /reports/income-statement
====================================================== */

router.post('/income-statement', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        error: 'No autenticado',
      })
    }

    const { start, end } = req.body

    if (typeof start !== 'string' || typeof end !== 'string') {
      return res.status(400).json({
        status: false,
        error: 'start y end son obligatorios',
      })
    }

    const report = await generateAndSaveIncomeStatement(req.user.companyId, {
      start,
      end,
    })

    return res.status(201).json({
      status: true,
      report,
    })
  } catch (error: unknown) {
    return res.status(500).json({
      status: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

/* ======================================================
   📜 HISTÓRICO
   GET /reports/income-statement/history
====================================================== */

router.get('/income-statement/history', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        error: 'No autenticado',
      })
    }

    const snapshots = await incomeStatementRepository.findByCompany(req.user.companyId)

    return res.json({
      status: true,
      items: snapshots,
    })
  } catch (error: unknown) {
    return res.status(500).json({
      status: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

/* ======================================================
   📄 DETALLE POR ID
   GET /reports/income-statement/:id
====================================================== */

router.get('/income-statement/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        error: 'No autenticado',
      })
    }

    const snapshot = await incomeStatementRepository.findById(req.params.id)

    if (!snapshot) {
      return res.status(404).json({
        status: false,
        error: 'Estado de resultados no encontrado',
      })
    }

    return res.json({
      status: true,
      snapshot,
    })
  } catch (error: unknown) {
    return res.status(500).json({
      status: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

export { router as reportRoutes }
