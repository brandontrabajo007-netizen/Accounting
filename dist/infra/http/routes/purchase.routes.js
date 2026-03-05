"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseRoutes = void 0;
const registerPurchase_1 = require("@application/eventos/Purchase/use-cases/registerPurchase");
const express_1 = __importDefault(require("express"));
const dependencies_1 = require("../dependencies");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.purchaseRoutes = router;
const { registerPurchase } = (0, registerPurchase_1.makeRegisterPurchase)({
    accountRepository: dependencies_1.accountRepository,
    purchaseAccountMappingRepository: dependencies_1.purchaseAccountMappingRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
    periodAccessGuard: dependencies_1.periodAccessGuard,
    resolvePeriodId: dependencies_1.resolvePeriodId,
    accountsPayable: dependencies_1.accountsPayableOrchestrator,
    supplierHistory: dependencies_1.supplierHistoryService,
});
router.post('/purchase', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user.companyId) {
            return res.status(401).json({
                status: false,
                error: 'Usuario no autenticado o sin companyId',
            });
        }
        const companyId = req.user.companyId;
        const body = req.body;
        const result = await registerPurchase({
            description: body.description,
            amount: body.amount,
            includesVAT: body.includesVAT,
            debitAccount: body.debitAccount,
            paymentMethod: body.paymentMethod,
            supplier: body.supplier,
            date: body.date,
            companyId, // <-- viene del token
            periodId: body.periodId,
        });
        return res.status(201).json({
            status: true,
            journalEntry: result,
        });
    }
    catch (error) {
        return res.status(400).json({
            status: false,
            error: error.message ?? 'Unexpected error',
        });
    }
});
