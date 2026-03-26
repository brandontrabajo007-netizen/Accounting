"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceSettingsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const dependencies_1 = require("../dependencies");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.invoiceSettingsRoutes = router;
router.get('/invoice/settings', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const settings = await dependencies_1.invoiceIssuerSettingsRepository.getByCompanyId(req.user.companyId);
        return res.json({
            status: true,
            settings: settings ?? {
                companyId: req.user.companyId,
                companyName: null,
                taxId: null,
                contactPhone: null,
                address: null,
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.put('/invoice/settings', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const isValidOptional = (value) => value === undefined || value === null || typeof value === 'string';
        if (!isValidOptional(req.body?.companyName) || !isValidOptional(req.body?.taxId) || !isValidOptional(req.body?.contactPhone) || !isValidOptional(req.body?.address)) {
            return res.status(400).json({
                status: false,
                error: 'companyName, taxId, contactPhone y address deben ser string, null o undefined.',
            });
        }
        const existing = await dependencies_1.invoiceIssuerSettingsRepository.getByCompanyId(req.user.companyId);
        const companyName = req.body?.companyName !== undefined ? req.body.companyName : existing?.companyName ?? null;
        const taxId = req.body?.taxId !== undefined ? req.body.taxId : existing?.taxId ?? null;
        const contactPhone = req.body?.contactPhone !== undefined ? req.body.contactPhone : existing?.contactPhone ?? null;
        const address = req.body?.address !== undefined ? req.body.address : existing?.address ?? null;
        const saved = await dependencies_1.invoiceIssuerSettingsRepository.save({
            companyId: req.user.companyId,
            companyName,
            taxId,
            contactPhone,
            address,
        });
        return res.json({ status: true, settings: saved });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
