"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.arRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const dependencies_1 = require("../dependencies");
const router = express_1.default.Router();
exports.arRoutes = router;
const parseIntParam = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
router.get('/ar/settings', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const settings = await dependencies_1.arSettingsRepository.getByCompanyId(req.user.companyId);
        return res.json({
            status: true,
            settings: settings ?? {
                companyId: req.user.companyId,
                enabled: false,
                defaultCreditWhenMissingPaymentMethod: true,
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.put('/ar/settings', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const enabled = req.body?.enabled;
        const defaultCreditWhenMissingPaymentMethod = req.body?.defaultCreditWhenMissingPaymentMethod;
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ status: false, error: 'enabled debe ser boolean' });
        }
        if (typeof defaultCreditWhenMissingPaymentMethod !== 'boolean') {
            return res.status(400).json({ status: false, error: 'defaultCreditWhenMissingPaymentMethod debe ser boolean' });
        }
        const saved = await dependencies_1.arSettingsRepository.save({
            companyId: req.user.companyId,
            enabled,
            defaultCreditWhenMissingPaymentMethod,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return res.json({ status: true, settings: saved });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.get('/ar/customers', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const page = parseIntParam(req.query.page, 1);
        const limit = parseIntParam(req.query.limit, 50);
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const includeBalance = req.query.includeBalance !== 'false';
        const { items, total } = await dependencies_1.arCustomerRepository.listByCompany(req.user.companyId, { page, limit, search });
        if (!includeBalance) {
            return res.json({ status: true, items, total, page, limit });
        }
        const balances = await dependencies_1.arEntryRepository.listBalancesByCompany(req.user.companyId);
        const balanceMap = new Map(balances.map((row) => [row.customerId, row.balance]));
        const itemsWithBalance = items.map((customer) => ({
            ...customer,
            balance: balanceMap.get(customer.id) ?? 0,
        }));
        return res.json({ status: true, items: itemsWithBalance, total, page, limit });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.get('/ar/debtors', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const balances = await dependencies_1.arEntryRepository.listBalancesByCompany(req.user.companyId);
        const debtors = balances.filter((row) => row.balance > 0);
        const customers = await dependencies_1.arCustomerRepository.findByIds(debtors.map((row) => row.customerId));
        const customerMap = new Map(customers.map((customer) => [customer.id, customer]));
        const items = debtors
            .map((row) => {
            const customer = customerMap.get(row.customerId);
            if (!customer)
                return null;
            return { customer, balance: row.balance };
        })
            .filter((row) => Boolean(row));
        return res.json({ status: true, items });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.get('/ar/customers/:customerId/balance', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const customerId = req.params.customerId;
        const customer = await dependencies_1.arCustomerRepository.findById(customerId);
        if (!customer || customer.companyId !== req.user.companyId) {
            return res.status(404).json({ status: false, error: 'Cliente no encontrado' });
        }
        const balance = await dependencies_1.arEntryRepository.getBalanceByCustomer(req.user.companyId, customerId);
        return res.json({ status: true, customer, balance });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.get('/ar/customers/:customerId/statement', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const customerId = req.params.customerId;
        const customer = await dependencies_1.arCustomerRepository.findById(customerId);
        if (!customer || customer.companyId !== req.user.companyId) {
            return res.status(404).json({ status: false, error: 'Cliente no encontrado' });
        }
        const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined;
        const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined;
        if (from && Number.isNaN(from.getTime())) {
            return res.status(400).json({ status: false, error: 'from invalido' });
        }
        if (to && Number.isNaN(to.getTime())) {
            return res.status(400).json({ status: false, error: 'to invalido' });
        }
        const page = parseIntParam(req.query.page, 1);
        const limit = parseIntParam(req.query.limit, 100);
        const sort = req.query.sort === 'desc' ? 'desc' : 'asc';
        const [history, balance] = await Promise.all([
            dependencies_1.customerHistoryRepository.listByCustomer(req.user.companyId, customerId, { from, to, page, limit, sort }),
            dependencies_1.arEntryRepository.getBalanceByCustomer(req.user.companyId, customerId),
        ]);
        return res.json({
            status: true,
            customer,
            balance,
            history: history.items,
            page,
            limit,
            total: history.total,
            sort,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
router.get('/ar/customers/:customerId', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ status: false, error: 'No autenticado' });
        const customerId = req.params.customerId;
        const customer = await dependencies_1.arCustomerRepository.findById(customerId);
        if (!customer || customer.companyId !== req.user.companyId) {
            return res.status(404).json({ status: false, error: 'Cliente no encontrado' });
        }
        return res.json({ status: true, customer });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({ status: false, error: message });
    }
});
