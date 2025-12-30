import { makeGenerateAndSaveIncomeStatement } from '@application/reports/use-cases/generateAndSaveIncomeStatement'
import { makeGenerateIncomeStatement } from '@application/reports/use-cases/generateIncomeStatement'
import { makeGenerateIncomeStatementPdf } from '@application/reports/use-cases/makeGenerateIncomeStatementPdf'
import { makeGenerateIncomeStatementSnapshotPdf } from '@application/reports/use-cases/makeGenerateIncomeStatementSnapshotPdf'
import express from 'express'
import { accountRepository, incomeStatementRepository, journalEntryRepository, reportPdfGenerator } from '../dependencies'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

/* ======================================================
   Casos de uso
====================================================== */

const { generateIncomeStatement } = makeGenerateIncomeStatement({
  accountRepository,
  journalEntryRepository,
})
const generateIncomeStatementPdf = makeGenerateIncomeStatementPdf({
  generateIncomeStatement,
  reportPdfGenerator,
})
const generateIncomeStatementSnapshotPdf = makeGenerateIncomeStatementSnapshotPdf({
  incomeStatementRepository,
  reportPdfGenerator,
})

const { execute: generateAndSaveIncomeStatement } = makeGenerateAndSaveIncomeStatement({
  accountRepository,
  incomeStatementRepository,
  journalEntryRepository,
})

/* ======================================================
  PREVIEW (NO guarda)
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
      { start, end }, // STRINGS
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
   PDF  PREVIEW (NO guarda)
   GET /reports/income-statement/pdf?start=YYYY-MM-DD&end=YYYY-MM-DD
====================================================== */

router.get('/income-statement/pdf', authMiddleware, async (req, res) => {
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

    const { stream, filename } = await generateIncomeStatementPdf.execute(req.user.companyId, { start, end })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    stream.pipe(res)
  } catch (error: unknown) {
    return res.status(500).json({
      status: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

/* ======================================================
   GENERAR + GUARDAR (snapshot)
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
   HISTORICO
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
   DETALLE POR ID
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

/* ======================================================
   PDF DESDE SNAPSHOT
   GET /reports/income-statement/:id/pdf
====================================================== */

router.get('/income-statement/:id/pdf', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        error: 'No autenticado',
      })
    }

    const { stream, filename } = await generateIncomeStatementSnapshotPdf.execute(req.user.companyId, req.params.id)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    stream.pipe(res)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    const status = message.includes('no encontrado') ? 404 : 500
    return res.status(status).json({
      status: false,
      error: message,
    })
  }
})

export { router as reportRoutes }
