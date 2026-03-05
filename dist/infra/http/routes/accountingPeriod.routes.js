"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountingPeriodRoutes = void 0;
const attemptCloseAccountingPeriod_1 = require("@application/accounting-periods/use-cases/attemptCloseAccountingPeriod");
const closeAccountingPeriod_1 = require("@application/accounting-periods/use-cases/closeAccountingPeriod");
const createAccountingPeriod_1 = require("@application/accounting-periods/use-cases/createAccountingPeriod");
const listAccountingPeriods_1 = require("@application/accounting-periods/use-cases/listAccountingPeriods");
const openAccountingPeriod_1 = require("@application/accounting-periods/use-cases/openAccountingPeriod");
const express_1 = __importDefault(require("express"));
const dependencies_1 = require("../dependencies");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.accountingPeriodRoutes = router;
const attemptCloseAccountingPeriod = (0, attemptCloseAccountingPeriod_1.makeAttemptCloseAccountingPeriod)({
    accountingPeriodRepository: dependencies_1.accountingPeriodRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
});
const closeAccountingPeriod = (0, closeAccountingPeriod_1.makeCloseAccountingPeriod)({
    accountingPeriodRepository: dependencies_1.accountingPeriodRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    periodResultRepository: dependencies_1.periodResultRepository,
    domainEventBus: dependencies_1.domainEventBus,
    transactionRunner: dependencies_1.transactionRunner,
    accountRepository: dependencies_1.accountRepository,
});
const createAccountingPeriod = (0, createAccountingPeriod_1.makeCreateAccountingPeriod)({ accountingPeriodRepository: dependencies_1.accountingPeriodRepository });
const listAccountingPeriods = (0, listAccountingPeriods_1.makeListAccountingPeriods)({ accountingPeriodRepository: dependencies_1.accountingPeriodRepository });
const openAccountingPeriod = (0, openAccountingPeriod_1.makeOpenAccountingPeriod)({ accountingPeriodRepository: dependencies_1.accountingPeriodRepository });
router.post('/accounting-periods/attempt-close', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const { periodId } = req.body;
        if (typeof periodId !== 'string' || !periodId)
            return res.status(400).json({ status: false, error: 'periodId requerido' });
        const result = await attemptCloseAccountingPeriod.execute(req.user.companyId, periodId);
        return res.json({ status: true, result });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.post('/accounting-periods/close', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const { periodId } = req.body;
        if (typeof periodId !== 'string' || !periodId)
            return res.status(400).json({ status: false, error: 'periodId requerido' });
        await closeAccountingPeriod.execute(req.user.companyId, periodId);
        return res.status(200).json({ status: true });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.post('/accounting-periods', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const { startDate, endDate, name } = req.body;
        if (typeof startDate !== 'string' || typeof endDate !== 'string') {
            return res.status(400).json({ status: false, error: 'startDate y endDate son obligatorios' });
        }
        const period = await createAccountingPeriod.execute({
            companyId: req.user.companyId,
            startDate,
            endDate,
            name,
        });
        return res.status(201).json({
            status: true,
            period: {
                id: period.id,
                label: period.name ?? period.id,
                status: period.status,
                start: period.start,
                end: period.end,
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.get('/accounting-periods', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const periods = await listAccountingPeriods.execute(req.user.companyId);
        return res.json({
            status: true,
            items: periods.map((p) => ({
                id: p.id,
                label: p.name ?? p.id,
                status: p.status,
                start: p.start,
                end: p.end,
            })),
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.post('/accounting-periods/:id/open', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const { id } = req.params;
        const period = await openAccountingPeriod.execute(req.user.companyId, id);
        return res.json({
            status: true,
            period: {
                id: period.id,
                label: period.name ?? period.id,
                status: period.status,
                start: period.start,
                end: period.end,
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.get('/accounting-periods/:id/result', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const { id } = req.params;
        const companyId = req.user.companyId;
        const [result, ledgerSnapshot] = await Promise.all([dependencies_1.periodResultRepository.findByPeriod(companyId, id), dependencies_1.ledgerSnapshotRepository.findByPeriod(companyId, id)]);
        if (!result && !ledgerSnapshot) {
            return res.status(404).json({ status: false, error: 'Resultado no encontrado para el periodo' });
        }
        return res.json({
            status: true,
            periodId: id,
            result,
            ledgerSnapshot,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
