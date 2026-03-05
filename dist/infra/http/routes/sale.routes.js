"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleRoutes = void 0;
const registerSale_1 = require("@application/eventos/sales/use-cases/registerSale");
const express_1 = __importDefault(require("express"));
const dependencies_1 = require("../dependencies");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.saleRoutes = router;
const { registerSale } = (0, registerSale_1.makeRegisterSale)({
    accountRepository: dependencies_1.accountRepository,
    saleAccountMappingRepository: dependencies_1.saleAccountMappingRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
    periodAccessGuard: dependencies_1.periodAccessGuard,
    resolvePeriodId: dependencies_1.resolvePeriodId,
    accountsReceivable: dependencies_1.accountsReceivableOrchestrator,
    customerHistory: dependencies_1.customerHistoryService,
});
// 🔐 REGISTRAR VENTA (PROTEGIDO CON JWT)
router.post('/sale', auth_1.authMiddleware, async (req, res) => {
    try {
        const body = req.body;
        // Guard para que TS y Biome estén felices
        if (!req.user) {
            return res.status(500).json({
                status: false,
                error: 'Usuario autenticado no encontrado en la petición',
            });
        }
        const companyId = req.user.companyId;
        const result = await registerSale({
            description: body.description,
            totalAmount: body.totalAmount,
            date: body.date,
            includesVAT: body.includesVAT,
            includesCost: body.includesCost,
            quantity: body.quantity,
            unitCost: body.unitCost,
            unitPrice: body.unitPrice,
            customerName: body.customerName,
            paymentMethod: body.paymentMethod,
            companyId, // siempre del token
            periodId: body.periodId,
        });
        return res.status(201).json({
            status: true,
            journalEntry: result,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({
            status: false,
            error: message,
        });
    }
});
