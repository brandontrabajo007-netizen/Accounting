"use strict";
// src/infra/http/routes/report.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoutes = void 0;
const generateIncomeStatement_1 = require("@application/reports/use-cases/generateIncomeStatement");
const express_1 = __importDefault(require("express"));
const dependencies_1 = require("../dependencies");
const router = express_1.default.Router();
exports.reportRoutes = router;
// 🧠 Caso de uso: Estado de Resultados
const { generateIncomeStatement } = (0, generateIncomeStatement_1.makeGenerateIncomeStatement)({
    journalEntryRepository: dependencies_1.journalEntryRepository,
    accountRepository: dependencies_1.accountRepository,
});
// 🌐 Endpoint GET /reports/income-statement?companyId=sahet
router.get('/income-statement', async (req, res) => {
    try {
        const companyId = req.query.companyId;
        if (!companyId) {
            return res.status(400).json({
                status: false,
                error: 'companyId is required',
            });
        }
        const result = await generateIncomeStatement(companyId, {
            start: new Date(req.query.start),
            end: new Date(req.query.end),
        });
        return res.json({
            status: true,
            result,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(500).json({
            status: false,
            error: message,
        });
    }
});
