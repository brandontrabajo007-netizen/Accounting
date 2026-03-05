"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountRoutes = void 0;
const node_crypto_1 = require("node:crypto");
const listAccountMovements_1 = require("@application/accounts/use-cases/listAccountMovements");
const listAccounts_1 = require("@application/accounts/use-cases/listAccounts");
const AccountType_1 = require("@domain/accounts/AccountType");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const express_1 = __importDefault(require("express"));
const dependencies_1 = require("../dependencies");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.accountRoutes = router;
const listAccounts = (0, listAccounts_1.makeListAccounts)({ accountRepository: dependencies_1.accountRepository });
const listAccountMovements = (0, listAccountMovements_1.makeListAccountMovements)({
    ledgerMovementRepository: dependencies_1.ledgerMovementRepository,
    accountRepository: dependencies_1.accountRepository,
    accountingPeriodRepository: dependencies_1.accountingPeriodRepository,
});
const defaultOffsetAccountCode = Number(process.env.EQUITY_ACCOUNT_CODE ?? 3605);
const parseDate = (value) => {
    if (typeof value !== 'string' || !value.trim())
        return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};
router.get('/accounts', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const items = await listAccounts.execute(req.user.companyId);
        return res.json({
            status: true,
            items,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.get('/accounts/:accountCode/movements', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const accountCode = Number(req.params.accountCode);
        if (!Number.isFinite(accountCode)) {
            return res.status(400).json({ status: false, error: 'accountCode inválido' });
        }
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 50);
        const includeRunningBalance = req.query.includeRunningBalance !== 'false';
        const periodId = typeof req.query.periodId === 'string' ? req.query.periodId : undefined;
        const from = parseDate(req.query.from);
        if (from === null)
            return res.status(400).json({ status: false, error: 'from inválido' });
        const to = parseDate(req.query.to);
        if (to === null)
            return res.status(400).json({ status: false, error: 'to inválido' });
        const result = await listAccountMovements.execute({
            companyId: req.user.companyId,
            accountCode,
            periodId,
            from: from ?? undefined,
            to: to ?? undefined,
            page: Number.isFinite(page) ? page : 1,
            limit: Number.isFinite(limit) ? limit : 50,
            includeRunningBalance,
        });
        return res.json({
            status: true,
            ...result,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.post('/accounts/:accountCode/balance', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const accountCode = Number(req.params.accountCode);
        if (!Number.isFinite(accountCode)) {
            return res.status(400).json({ status: false, error: 'accountCode inválido' });
        }
        const value = Number(req.body?.value);
        if (!Number.isFinite(value)) {
            return res.status(400).json({ status: false, error: 'value inválido' });
        }
        const offsetAccountCode = Number(req.body?.offsetAccountCode ?? defaultOffsetAccountCode);
        if (!Number.isFinite(offsetAccountCode)) {
            return res.status(400).json({ status: false, error: 'offsetAccountCode inválido o faltante' });
        }
        const companyId = req.user.companyId;
        const [targetAccount, offsetAccount, currentBalance] = await Promise.all([
            dependencies_1.accountRepository.getByCode(accountCode),
            dependencies_1.accountRepository.getByCode(offsetAccountCode),
            dependencies_1.accountRepository.getBalance(companyId, accountCode),
        ]);
        const delta = value - currentBalance;
        if (delta === 0) {
            return res.json({ status: true, accountCode, value, message: 'Saldo ya coincide, no se realizaron movimientos' });
        }
        const increaseIsDebit = targetAccount.type === AccountType_1.AccountType.ASSET || targetAccount.type === AccountType_1.AccountType.EXPENSE;
        const targetMovementType = delta > 0 ? (increaseIsDebit ? TransactionType_1.TransactionTypes.DEBIT : TransactionType_1.TransactionTypes.CREDIT) : increaseIsDebit ? TransactionType_1.TransactionTypes.CREDIT : TransactionType_1.TransactionTypes.DEBIT;
        const adjustmentAmount = Math.abs(delta);
        const offsetMovementType = targetMovementType === TransactionType_1.TransactionTypes.DEBIT ? TransactionType_1.TransactionTypes.CREDIT : TransactionType_1.TransactionTypes.DEBIT;
        const description = typeof req.body?.description === 'string' && req.body.description.trim() ? req.body.description.trim() : `Ajuste manual de saldo cuenta ${accountCode}`;
        const journalEntry = {
            id: (0, node_crypto_1.randomUUID)(),
            companyId,
            date: new Date(),
            description,
            status: JournalEntryStatus_1.JournalEntryStatus.CREATED,
            movements: [
                {
                    accountCode,
                    accountName: targetAccount.name,
                    type: targetMovementType,
                    amount: adjustmentAmount,
                    status: MovementStatus_1.MovementStatus.PROCESSED,
                    group: 'MAIN',
                },
                {
                    accountCode: offsetAccountCode,
                    accountName: offsetAccount.name,
                    type: offsetMovementType,
                    amount: adjustmentAmount,
                    status: MovementStatus_1.MovementStatus.PROCESSED,
                    group: 'MAIN',
                },
            ],
        };
        const processedEntry = await dependencies_1.processJournalEntry.processEntry(journalEntry, null);
        return res.json({
            status: true,
            accountCode,
            value,
            delta,
            journalEntryId: processedEntry.id,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
