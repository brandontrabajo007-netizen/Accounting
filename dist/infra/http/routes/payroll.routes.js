"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrollRoutes = void 0;
const registerPayroll_1 = require("@application/eventos/Payroll/use-case/registerPayroll");
const express_1 = require("express");
const dependencies_1 = require("../dependencies");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.payrollRoutes = router;
// Caso de uso inyectado
const { registerPayroll } = (0, registerPayroll_1.makeRegisterPayroll)({
    accountRepository: dependencies_1.accountRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    payrollAccountMappingRepository: dependencies_1.payrollAccountMappingRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
    periodAccessGuard: dependencies_1.periodAccessGuard,
    resolvePeriodId: dependencies_1.resolvePeriodId,
});
router.post('/payroll', auth_1.authMiddleware, async (req, res) => {
    try {
        const body = req.body;
        const result = await registerPayroll(body);
        return res.status(201).json({
            status: true,
            journalEntry: result,
        });
    }
    catch (error) {
        console.error('❌ Error registrando nómina:', error);
        return res.status(400).json({
            status: false,
            error: error.message ?? 'Unexpected error',
        });
    }
});
