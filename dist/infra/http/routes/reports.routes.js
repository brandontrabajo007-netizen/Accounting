"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoutes = void 0;
const generateAndSaveIncomeStatement_1 = require("@application/reports/use-cases/generateAndSaveIncomeStatement");
const generateIncomeStatement_1 = require("@application/reports/use-cases/generateIncomeStatement");
const makeGenerateIncomeStatementPdf_1 = require("@application/reports/use-cases/makeGenerateIncomeStatementPdf");
const makeGenerateIncomeStatementSnapshotPdf_1 = require("@application/reports/use-cases/makeGenerateIncomeStatementSnapshotPdf");
const express_1 = __importDefault(require("express"));
const dependencies_1 = require("../dependencies");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.reportRoutes = router;
/* ======================================================
   Casos de uso
====================================================== */
const { generateIncomeStatement } = (0, generateIncomeStatement_1.makeGenerateIncomeStatement)({
    accountRepository: dependencies_1.accountRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
});
const generateIncomeStatementPdf = (0, makeGenerateIncomeStatementPdf_1.makeGenerateIncomeStatementPdf)({
    generateIncomeStatement,
    reportPdfGenerator: dependencies_1.reportPdfGenerator,
});
const generateIncomeStatementSnapshotPdf = (0, makeGenerateIncomeStatementSnapshotPdf_1.makeGenerateIncomeStatementSnapshotPdf)({
    incomeStatementRepository: dependencies_1.incomeStatementRepository,
    reportPdfGenerator: dependencies_1.reportPdfGenerator,
});
const { execute: generateAndSaveIncomeStatement } = (0, generateAndSaveIncomeStatement_1.makeGenerateAndSaveIncomeStatement)({
    accountRepository: dependencies_1.accountRepository,
    incomeStatementRepository: dependencies_1.incomeStatementRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
});
/* ======================================================
  PREVIEW (NO guarda)
   GET /reports/income-statement?start=YYYY-MM-DD&end=YYYY-MM-DD
====================================================== */
router.get('/income-statement', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                error: 'No autenticado',
            });
        }
        const { start, end } = req.query;
        if (typeof start !== 'string' || typeof end !== 'string') {
            return res.status(400).json({
                status: false,
                error: 'start y end son obligatorios',
            });
        }
        const result = await generateIncomeStatement(req.user.companyId, { start, end });
        return res.json({
            status: true,
            result,
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            error: error instanceof Error ? error.message : 'Unexpected error',
        });
    }
});
/* ======================================================
   PDF  PREVIEW (NO guarda)
   GET /reports/income-statement/pdf?start=YYYY-MM-DD&end=YYYY-MM-DD
====================================================== */
router.get('/income-statement/pdf', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                error: 'No autenticado',
            });
        }
        const { start, end } = req.query;
        if (typeof start !== 'string' || typeof end !== 'string') {
            return res.status(400).json({
                status: false,
                error: 'start y end son obligatorios',
            });
        }
        const { stream, filename } = await generateIncomeStatementPdf.execute(req.user.companyId, { start, end });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        stream.pipe(res);
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            error: error instanceof Error ? error.message : 'Unexpected error',
        });
    }
});
/* ======================================================
   GENERAR + GUARDAR (snapshot)
   POST /reports/income-statement
====================================================== */
router.post('/income-statement', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                error: 'No autenticado',
            });
        }
        const { start, end } = req.body;
        if (typeof start !== 'string' || typeof end !== 'string') {
            return res.status(400).json({
                status: false,
                error: 'start y end son obligatorios',
            });
        }
        const report = await generateAndSaveIncomeStatement(req.user.companyId, {
            start,
            end,
        });
        return res.status(201).json({
            status: true,
            report,
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            error: error instanceof Error ? error.message : 'Unexpected error',
        });
    }
});
/* ======================================================
   HISTORICO
   GET /reports/income-statement/history
====================================================== */
router.get('/income-statement/history', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                error: 'No autenticado',
            });
        }
        const snapshots = await dependencies_1.incomeStatementRepository.findByCompany(req.user.companyId);
        return res.json({
            status: true,
            items: snapshots,
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            error: error instanceof Error ? error.message : 'Unexpected error',
        });
    }
});
/* ======================================================
   DETALLE POR ID
   GET /reports/income-statement/:id
====================================================== */
router.get('/income-statement/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                error: 'No autenticado',
            });
        }
        const snapshot = await dependencies_1.incomeStatementRepository.findById(req.params.id);
        if (!snapshot) {
            return res.status(404).json({
                status: false,
                error: 'Estado de resultados no encontrado',
            });
        }
        return res.json({
            status: true,
            snapshot,
        });
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            error: error instanceof Error ? error.message : 'Unexpected error',
        });
    }
});
/* ======================================================
   PDF DESDE SNAPSHOT
   GET /reports/income-statement/:id/pdf
====================================================== */
router.get('/income-statement/:id/pdf', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                error: 'No autenticado',
            });
        }
        const { stream, filename } = await generateIncomeStatementSnapshotPdf.execute(req.user.companyId, req.params.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        stream.pipe(res);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        const status = message.includes('no encontrado') ? 404 : 500;
        return res.status(status).json({
            status: false,
            error: message,
        });
    }
});
