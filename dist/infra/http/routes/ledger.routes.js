"use strict";
// src/infra/http/routes/ledger.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerRoutes = void 0;
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const LedgerMovementModel_1 = require("@infra/persistence/mongo/models/LedgerMovementModel");
const express_1 = __importDefault(require("express"));
const dependencies_1 = require("../dependencies");
const router = express_1.default.Router();
exports.ledgerRoutes = router;
// ---------------------------------------------------------
// 1) Obtener saldos reales por empresa
// GET /ledger/:companyId
// ---------------------------------------------------------
router.get('/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const balances = await dependencies_1.ledgerBalanceRepository.getAllByCompany(companyId);
        return res.json({
            status: 'ok',
            companyId,
            balances,
        });
    }
    catch (err) {
        console.error('Error getting ledger balances:', err);
        return res.status(500).json({
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
        });
    }
});
// ---------------------------------------------------------
// 2) Obtener movimientos contables reales (Ledger Movements)
// GET /ledger/movements/:companyId
// ---------------------------------------------------------
router.get('/movements/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const movements = await LedgerMovementModel_1.LedgerMovementMongoModel.find({ companyId }).sort({ date: -1 }).lean();
        return res.json({
            status: 'ok',
            companyId,
            movements,
        });
    }
    catch (err) {
        console.error('Error getting ledger movements:', err);
        return res.status(500).json({
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
        });
    }
});
// ---------------------------------------------------------
// 3) Listar solo Journal Entries en estado PROCESSED
// GET /journal/processed/:companyId
// ---------------------------------------------------------
router.get('/journal/processed/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const entries = await dependencies_1.journalEntryRepository.findByStatus(companyId, JournalEntryStatus_1.JournalEntryStatus.PROCESSED);
        return res.json({
            status: 'ok',
            companyId,
            processedEntries: entries,
        });
    }
    catch (err) {
        console.error('Error getting processed journal entries:', err);
        return res.status(500).json({
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
        });
    }
});
