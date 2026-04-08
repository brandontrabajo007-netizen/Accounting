"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramRoutes = void 0;
const getSupplierBalance_1 = require("@accounts-payable/application/use-cases/getSupplierBalance");
const getSupplierStatement_1 = require("@accounts-payable/application/use-cases/getSupplierStatement");
const listSuppliersWithBalance_1 = require("@accounts-payable/application/use-cases/listSuppliersWithBalance");
const getCustomerBalance_1 = require("@accounts-receivable/application/use-cases/getCustomerBalance");
const getCustomerStatement_1 = require("@accounts-receivable/application/use-cases/getCustomerStatement");
const listCustomersWithBalance_1 = require("@accounts-receivable/application/use-cases/listCustomersWithBalance");
const normalizeCustomerName_1 = require("@accounts-receivable/domain/normalizeCustomerName");
const registerCustomerPayment_1 = require("@application/eventos/customer-payments/use-cases/registerCustomerPayment");
const registerPayroll_1 = require("@application/eventos/Payroll/use-case/registerPayroll");
const registerPurchase_1 = require("@application/eventos/Purchase/use-cases/registerPurchase");
const registerSale_1 = require("@application/eventos/sales/use-cases/registerSale");
const registerSupplierPayment_1 = require("@application/eventos/supplier-payments/use-cases/registerSupplierPayment");
const aiSaleItemsParser_1 = require("@application/parsers/aiSaleItemsParser");
const generateIncomeStatement_1 = require("@application/reports/use-cases/generateIncomeStatement");
const AccountingPeriodStatus_1 = require("@domain/accounting-periods/AccountingPeriodStatus");
const EventType_enum_1 = require("@domain/events/EventType.enum");
const invoicePdfGenerator_1 = require("@infra/pdf/invoicePdfGenerator");
const telegramAdapter_1 = require("@infra/telegram/telegramAdapter");
const telegramClient_1 = require("@infra/telegram/telegramClient");
const whatsappClient_1 = require("@infra/whatsapp/whatsappClient");
const express_1 = __importDefault(require("express"));
const node_crypto_1 = require("node:crypto");
const dependencies_1 = require("../dependencies");
const router = express_1.default.Router();
exports.telegramRoutes = router;
const lastTelegramMessageIdByChat = new Map();
const { registerSale } = (0, registerSale_1.makeRegisterSale)({
    accountRepository: dependencies_1.accountRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    saleAccountMappingRepository: dependencies_1.saleAccountMappingRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
    periodAccessGuard: dependencies_1.periodAccessGuard,
    resolvePeriodId: dependencies_1.resolvePeriodId,
    accountsReceivable: dependencies_1.accountsReceivableOrchestrator,
    customerHistory: dependencies_1.customerHistoryService,
});
const { registerPurchase } = (0, registerPurchase_1.makeRegisterPurchase)({
    accountRepository: dependencies_1.accountRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    purchaseAccountMappingRepository: dependencies_1.purchaseAccountMappingRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
    periodAccessGuard: dependencies_1.periodAccessGuard,
    resolvePeriodId: dependencies_1.resolvePeriodId,
    accountsPayable: dependencies_1.accountsPayableOrchestrator,
    supplierHistory: dependencies_1.supplierHistoryService,
});
const { registerPayroll } = (0, registerPayroll_1.makeRegisterPayroll)({
    accountRepository: dependencies_1.accountRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    payrollAccountMappingRepository: dependencies_1.payrollAccountMappingRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
    periodAccessGuard: dependencies_1.periodAccessGuard,
    resolvePeriodId: dependencies_1.resolvePeriodId,
});
const { generateIncomeStatement } = (0, generateIncomeStatement_1.makeGenerateIncomeStatement)({
    accountRepository: dependencies_1.accountRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
});
const { registerCustomerPayment } = (0, registerCustomerPayment_1.makeRegisterCustomerPayment)({
    accountRepository: dependencies_1.accountRepository,
    customerPaymentAccountMappingRepository: dependencies_1.customerPaymentAccountMappingRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
    periodAccessGuard: dependencies_1.periodAccessGuard,
    resolvePeriodId: dependencies_1.resolvePeriodId,
    accountsReceivable: dependencies_1.accountsReceivableOrchestrator,
    customerHistory: dependencies_1.customerHistoryService,
});
const { registerSupplierPayment } = (0, registerSupplierPayment_1.makeRegisterSupplierPayment)({
    accountRepository: dependencies_1.accountRepository,
    supplierPaymentAccountMappingRepository: dependencies_1.supplierPaymentAccountMappingRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
    periodAccessGuard: dependencies_1.periodAccessGuard,
    resolvePeriodId: dependencies_1.resolvePeriodId,
    accountsPayable: dependencies_1.accountsPayableOrchestrator,
    supplierHistory: dependencies_1.supplierHistoryService,
});
const { getCustomerBalance } = (0, getCustomerBalance_1.makeGetCustomerBalance)({
    customerRepository: dependencies_1.arCustomerRepository,
    arEntryRepository: dependencies_1.arEntryRepository,
});
const { listCustomersWithBalance } = (0, listCustomersWithBalance_1.makeListCustomersWithBalance)({
    customerRepository: dependencies_1.arCustomerRepository,
    arEntryRepository: dependencies_1.arEntryRepository,
});
const { getCustomerStatement } = (0, getCustomerStatement_1.makeGetCustomerStatement)({
    customerRepository: dependencies_1.arCustomerRepository,
    arEntryRepository: dependencies_1.arEntryRepository,
    customerHistoryRepository: dependencies_1.customerHistoryRepository,
});
const { getSupplierBalance } = (0, getSupplierBalance_1.makeGetSupplierBalance)({
    supplierRepository: dependencies_1.apSupplierRepository,
    apEntryRepository: dependencies_1.apEntryRepository,
});
const { listSuppliersWithBalance } = (0, listSuppliersWithBalance_1.makeListSuppliersWithBalance)({
    supplierRepository: dependencies_1.apSupplierRepository,
    apEntryRepository: dependencies_1.apEntryRepository,
});
const { getSupplierStatement } = (0, getSupplierStatement_1.makeGetSupplierStatement)({
    supplierRepository: dependencies_1.apSupplierRepository,
    apEntryRepository: dependencies_1.apEntryRepository,
    supplierHistoryRepository: dependencies_1.supplierHistoryRepository,
});
const normalizeText = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
const looksLikeAccountingEvent = (value) => {
    const text = normalizeText(value);
    return /\b(vendi|vendio|venta|compre|compra|pague|pago|nomina|salario|ingreso|estado de resultados|utilidad|ganancia|perdi|perdida|debe|cobrar|extracto)\b/.test(text);
};
const looksLikeNewSaleMessage = (value) => {
    const text = normalizeText(value);
    const hasSaleWord = /\b(venta|vendi|vendio)\b/.test(text);
    const hasNumber = /\d/.test(text);
    return hasSaleWord && hasNumber && text.length > 20;
};
const isGreetingOrHelp = (value) => {
    const text = normalizeText(value);
    if (looksLikeAccountingEvent(text))
        return false;
    const greeting = /\b(hola|buenas|buenos dias|buenas tardes|buenas noches|hey)\b/.test(text);
    const help = /\b(que puedes hacer|como te uso|como funciona|ayuda|help|no entiendo|no entendi|no se|no se que hacer)\b/.test(text);
    return greeting || help;
};
const helpMessage = `
👋 ¡Hola! Soy tu asistente contable 🤖

Con mis superpoderes puedo:
📊 Registrar ventas, compras y pagos de nómina
💰 Consultar tu utilidad al instante (hoy, esta semana, este mes, este año)

*¿Cómo me usas?* 

💵 *Venta:*
"Vendí 10 pantalones a 50.000 me cuesta 36.000"

📦 *Compra:*
"Compré tela por 700.000 sin IVA en efectivo"

👥 *Nómina:*
"Pagué nómina 500000 por banco"

🧾 *Crear cliente:*
"Guíame para crear cliente"
"Crear cliente: Juan Pérez, cédula: 123456789, teléfono: 3001234567, ciudad: Cali, dirección: Cra 10 # 20-30"
"Consultar cliente: Juan Pérez"

🏢 *Datos de la empresa para factura:*
"Llenar datos de la empresa"

¡Cuéntame qué vendiste, compraste o pagaste! 🚀
`.trim();
const formatHelpMessage = (name) => {
    const trimmed = name?.trim();
    if (!trimmed)
        return helpMessage;
    return helpMessage.replace('Hola!', `Hola ${trimmed}!`);
};
function ensureChatId(chatId, res) {
    if (!chatId) {
        console.error('No chatId found, no puedo enviar respuesta');
        res.status(200).json({ ok: true });
        return false;
    }
    return true;
}
const formatDate = (value) => {
    if (value === null || value === undefined)
        return 'sin fecha';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 'sin fecha' : d.toISOString().slice(0, 10);
};
const formatCurrency = (value) => value.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});
const bogotaDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});
const getBogotaTodayRange = () => {
    const today = bogotaDateFormatter.format(new Date());
    return { start: today, end: today };
};
const toDateString = (date) => date.toISOString().slice(0, 10);
const getBogotaTodayUtc = () => {
    const parts = bogotaDateFormatter.format(new Date()).split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
};
const getBogotaCurrentWeekRange = () => {
    const today = getBogotaTodayUtc();
    const day = today.getUTCDay() === 0 ? 7 : today.getUTCDay();
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - (day - 1));
    return { start: toDateString(start), end: toDateString(today) };
};
const getBogotaCurrentMonthRange = () => {
    const today = getBogotaTodayUtc();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
    return { start: toDateString(start), end: toDateString(end) };
};
const getBogotaPreviousMonthRange = () => {
    const today = getBogotaTodayUtc();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
    return { start: toDateString(start), end: toDateString(end) };
};
const getBogotaCurrentYearRange = () => {
    const year = getBogotaTodayUtc().getUTCFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));
    return { start: toDateString(start), end: toDateString(end) };
};
const SALES_MONTH_NAME_TO_INDEX = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    setiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
};
const parseSalesMetricsMonthByName = (normalized) => {
    const monthMatch = normalized.match(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/);
    if (!monthMatch?.[1])
        return null;
    const monthIndex = SALES_MONTH_NAME_TO_INDEX[monthMatch[1]];
    if (monthIndex === undefined)
        return null;
    const currentYear = getBogotaTodayUtc().getUTCFullYear();
    const explicitYear = normalized.match(/\b(20\d{2})\b/);
    const inferredYear = /\b(ano|año)\s+pasado\b/.test(normalized) ? currentYear - 1 : currentYear;
    const year = explicitYear?.[1] ? Number(explicitYear[1]) : inferredYear;
    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 0));
    return { start: toDateString(start), end: toDateString(end) };
};
const parseSalesMetricsPeriod = (value) => {
    const normalized = normalizeText(value);
    if (/\b(mes\s+pasado|mes\s+anterior|anterior\s+mes)\b/.test(normalized))
        return getBogotaPreviousMonthRange();
    const monthByName = parseSalesMetricsMonthByName(normalized);
    if (monthByName)
        return monthByName;
    const parsed = telegramAdapter_1.TelegramAdapter.parseIncomeStatementPeriod(value);
    if (parsed)
        return parsed;
    if (/\b(esta semana|semana actual|semanal)\b/.test(normalized))
        return getBogotaCurrentWeekRange();
    if (/\b(este mes|mes actual|mensual)\b/.test(normalized))
        return getBogotaCurrentMonthRange();
    if (/\b(este ano|este año|ano actual|año actual|anual)\b/.test(normalized))
        return getBogotaCurrentYearRange();
    return getBogotaTodayRange();
};
const isSalesMetricsQuery = (value) => {
    const normalized = normalizeText(value);
    const asksSales = /\b(vendi|vender|ventas?|vendido|facture|facturacion)\b/.test(normalized);
    const asksMetric = /\b(cuanto|cuantos|cual|que|dime|muestrame|muestreme|resumen|reporte|informe|top|unidades|cantidad|dinero|plata|monto|valor|producto)\b/.test(normalized);
    const asksPeriod = /\b(hoy|semana|semanal|mes|mensual|ano|año|anual)\b/.test(normalized);
    const isPotentialSaleRegistration = /\b(vendi|venta)\b/.test(normalized) && /\d/.test(normalized) && /\b(a|por|cada)\b/.test(normalized);
    return asksSales && (asksMetric || asksPeriod) && !isPotentialSaleRegistration;
};
const toBogotaUtcRange = (period) => ({
    from: new Date(`${period.start}T00:00:00.000-05:00`),
    to: new Date(`${period.end}T23:59:59.999-05:00`),
});
const toJournalSearchRange = (period) => ({
    from: new Date(`${period.start}T00:00:00.000Z`),
    to: new Date(`${period.end}T23:59:59.999-05:00`),
});
const dayInPeriod = (day, period) => day >= period.start && day <= period.end;
const isMidnightUtc = (value) => value.getUTCHours() === 0 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0 &&
    value.getUTCMilliseconds() === 0;
const isJournalDateWithinPeriod = (value, period) => {
    if (Number.isNaN(value.getTime()))
        return false;
    if (isMidnightUtc(value)) {
        const utcDay = value.toISOString().slice(0, 10);
        return dayInPeriod(utcDay, period);
    }
    const bogotaDay = bogotaDateFormatter.format(value);
    return dayInPeriod(bogotaDay, period);
};
const parseMovementType = (value) => normalizeText(String(value ?? ''));
const parseMovementGroup = (value) => String(value ?? '').toUpperCase();
const getSaleAmountFromJournalEntry = (entry) => {
    const revenueDebit = entry.movements
        .filter((movement) => parseMovementType(movement.type) === 'debit' && parseMovementGroup(movement.group) === 'REVENUE')
        .reduce((sum, movement) => sum + (Number.isFinite(movement.amount) ? movement.amount : 0), 0);
    if (revenueDebit > 0)
        return revenueDebit;
    const revenueCredit = entry.movements
        .filter((movement) => parseMovementType(movement.type) === 'credit' && parseMovementGroup(movement.group) === 'REVENUE')
        .reduce((sum, movement) => sum + (Number.isFinite(movement.amount) ? movement.amount : 0), 0);
    if (revenueCredit > 0)
        return revenueCredit;
    const eventType = normalizeText(String(entry.eventType ?? ''));
    const description = normalizeText(String(entry.description ?? ''));
    const looksLikeSale = eventType === EventType_enum_1.EventType.SALE || /\bventa\b/.test(description);
    if (!looksLikeSale)
        return 0;
    const debitAmounts = entry.movements
        .filter((movement) => parseMovementType(movement.type) === 'debit' && Number.isFinite(movement.amount) && movement.amount > 0)
        .map((movement) => movement.amount);
    if (debitAmounts.length === 0)
        return 0;
    return Math.max(...debitAmounts);
};
const getSalesMetricsSummary = async (companyId, period) => {
    const inventoryRange = toBogotaUtcRange(period);
    const journalRange = toJournalSearchRange(period);
    const productQtyMap = new Map();
    let totalUnits = 0;
    let page = 1;
    const pageSize = 500;
    let totalMovements = 0;
    while (true) {
        const movementPage = await dependencies_1.inventoryGateway.listMovements({
            companyId,
            type: 'OUT',
            from: inventoryRange.from,
            to: inventoryRange.to,
            page,
            pageSize,
        });
        totalMovements = movementPage.total;
        for (const movement of movementPage.items) {
            if (movement.type !== 'OUT')
                continue;
            if (movement.reference.type !== 'SALE')
                continue;
            const qty = Number(movement.qty ?? 0);
            if (!Number.isFinite(qty) || qty <= 0)
                continue;
            totalUnits += qty;
            const productId = String(movement.productId);
            productQtyMap.set(productId, (productQtyMap.get(productId) ?? 0) + qty);
        }
        if (movementPage.items.length === 0 || page * pageSize >= totalMovements)
            break;
        page += 1;
    }
    const sortedProductQty = Array.from(productQtyMap.entries()).sort((a, b) => b[1] - a[1]);
    const productBreakdown = await Promise.all(sortedProductQty.map(async ([productId, qty]) => {
        try {
            const product = await dependencies_1.inventoryGateway.getProductById(companyId, productId);
            const productName = product?.name?.trim() ? product.name.trim() : productId;
            return { productId, productName, qty };
        }
        catch {
            return { productId, productName: productId, qty };
        }
    }));
    const topProduct = productBreakdown[0] ?? null;
    let totalSalesMoneyFromJournal = 0;
    let journalPage = 1;
    const journalLimit = 200;
    let totalJournalPages = 1;
    do {
        const pageResult = await dependencies_1.journalEntryRepository.findPaginated({
            companyId,
            page: journalPage,
            limit: journalLimit,
            from: journalRange.from,
            to: journalRange.to,
        });
        for (const entry of pageResult.docs) {
            if (!isJournalDateWithinPeriod(entry.date, period))
                continue;
            const saleAmount = getSaleAmountFromJournalEntry(entry);
            totalSalesMoneyFromJournal += saleAmount;
        }
        totalJournalPages = Math.max(1, pageResult.totalPages);
        journalPage += 1;
    } while (journalPage <= totalJournalPages);
    let totalSalesMoneyFromInvoices = 0;
    let invoicePage = 1;
    const invoiceLimit = 200;
    let totalInvoiceRecords = 0;
    while (true) {
        const invoicePageResult = await dependencies_1.pendingEventRepository.listByCompany({
            companyId,
            eventType: 'invoice_signature',
            from: inventoryRange.from,
            to: inventoryRange.to,
            page: invoicePage,
            limit: invoiceLimit,
        });
        totalInvoiceRecords = invoicePageResult.total;
        for (const event of invoicePageResult.items) {
            const invoiceData = event.interpretedData;
            const amount = Number(invoiceData.totalAmount ?? 0);
            if (!Number.isFinite(amount) || amount <= 0)
                continue;
            totalSalesMoneyFromInvoices += amount;
        }
        if (invoicePageResult.items.length === 0 || invoicePage * invoiceLimit >= totalInvoiceRecords)
            break;
        invoicePage += 1;
    }
    const totalSalesMoney = totalSalesMoneyFromInvoices > 0 ? totalSalesMoneyFromInvoices : totalSalesMoneyFromJournal;
    return {
        totalUnits,
        topProductName: topProduct?.productName ?? null,
        topProductQty: topProduct?.qty ?? 0,
        productBreakdown,
        totalSalesMoney: Math.round(totalSalesMoney),
    };
};
const normalizeBaseUrl = (value) => {
    if (!value)
        return null;
    const trimmed = value.trim().replace(/\/+$/, '');
    if (!trimmed)
        return null;
    try {
        const parsed = new URL(trimmed);
        if (!/^https?:$/i.test(parsed.protocol))
            return null;
        return parsed.toString().replace(/\/+$/, '');
    }
    catch {
        return null;
    }
};
const getFirstCorsOrigin = () => {
    const origins = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((origin) => normalizeBaseUrl(origin))
        .filter((origin) => Boolean(origin));
    return origins[0] ?? null;
};
const getSignatureFrontendBaseUrl = () => {
    const configured = normalizeBaseUrl(process.env.SIGNATURE_FRONTEND_URL) ??
        normalizeBaseUrl(process.env.FRONTEND_URL) ??
        getFirstCorsOrigin() ??
        normalizeBaseUrl(process.env.APP_URL) ??
        'http://localhost:5173';
    if (process.env.NODE_ENV === 'production' && /^http:\/\/localhost(?::\d+)?$/i.test(configured)) {
        console.warn('[telegram] Signature link is using localhost in production. Set SIGNATURE_FRONTEND_URL to your public frontend URL.');
    }
    return configured;
};
const createSignatureToken = () => (0, node_crypto_1.randomBytes)(24).toString('hex');
const normalizeSignatureDataUrl = (value) => {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    const match = trimmed.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
    if (!match?.[1])
        return null;
    const sizeBytes = Math.ceil((match[1].length * 3) / 4);
    if (sizeBytes <= 0 || sizeBytes > 1000000)
        return null;
    return trimmed;
};
const canUseTelegramUrlButton = (url) => {
    if (!/^https:\/\//i.test(url))
        return false;
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1')
            return false;
        if (host.endsWith('.local'))
            return false;
        return true;
    }
    catch {
        return false;
    }
};
const PENDING_EXPIRATION_MINUTES = 10;
const CALLBACK_PREFIX = 'p';
const GUIDED_CALLBACK_PREFIX = 'g';
const SIGN_CALLBACK_PREFIX = 's';
const CALLBACK_ACTIONS = {
    confirm: 'c',
    confirmCustomer: 'cc',
    confirmNew: 'cn',
    confirmSupplier: 'cs',
    confirmNewSupplier: 'cns',
    cancel: 'x',
};
const SIGN_CALLBACK_ACTIONS = {
    copy: 'cp',
};
const GUIDED_ACTIONS = {
    yes: 'y',
    no: 'n',
    confirm: 'c',
    cancel: 'x',
    unit: 'u',
    total: 't',
};
const GUIDED_VARIANT_ACTIONS = {
    qtyPrefix: 'vq_',
    manual: 'vqm',
    fillZeros: 'vqz',
};
const VARIANT_QTY_MANUAL_INPUT_TOKEN = '__variant_manual__';
const VARIANT_QTY_FILL_ZERO_TOKEN = '__variant_fill_zero__';
const buildCallbackData = (pendingId, action, entityId) => [CALLBACK_PREFIX, pendingId, action, entityId].filter(Boolean).join('|');
const parseCallbackData = (data) => {
    if (!data)
        return null;
    const [prefix, pendingId, action, entityId] = data.split('|');
    if (prefix !== CALLBACK_PREFIX || !pendingId || !action)
        return null;
    return { pendingId, action, entityId };
};
const buildGuidedCallbackData = (action) => [GUIDED_CALLBACK_PREFIX, action].filter(Boolean).join('|');
const buildGuidedVariantQtyAction = (qty) => `${GUIDED_VARIANT_ACTIONS.qtyPrefix}${qty}`;
const parseGuidedVariantQtyAction = (action) => {
    if (!action.startsWith(GUIDED_VARIANT_ACTIONS.qtyPrefix))
        return null;
    const raw = action.slice(GUIDED_VARIANT_ACTIONS.qtyPrefix.length);
    if (!/^\d+$/.test(raw))
        return null;
    const qty = Number(raw);
    return Number.isInteger(qty) && qty >= 0 ? qty : null;
};
const parseGuidedCallbackData = (data) => {
    if (!data)
        return null;
    const [prefix, action] = data.split('|');
    if (prefix !== GUIDED_CALLBACK_PREFIX || !action)
        return null;
    return { action };
};
const mapGuidedSaleCallbackActionToText = (action) => {
    if (action === GUIDED_ACTIONS.yes)
        return 'si';
    if (action === GUIDED_ACTIONS.no)
        return 'no';
    if (action === GUIDED_ACTIONS.confirm)
        return 'confirmar';
    if (action === GUIDED_ACTIONS.cancel)
        return 'cancelar';
    if (action === GUIDED_ACTIONS.unit)
        return 'unitario';
    if (action === GUIDED_ACTIONS.total)
        return 'total';
    if (action === GUIDED_VARIANT_ACTIONS.manual)
        return VARIANT_QTY_MANUAL_INPUT_TOKEN;
    if (action === GUIDED_VARIANT_ACTIONS.fillZeros)
        return VARIANT_QTY_FILL_ZERO_TOKEN;
    const quickQty = parseGuidedVariantQtyAction(action);
    if (quickQty !== null)
        return String(quickQty);
    return '';
};
const buildSignCallbackData = (pendingId, action) => [SIGN_CALLBACK_PREFIX, pendingId, action].join('|');
const parseSignCallbackData = (data) => {
    if (!data)
        return null;
    const [prefix, pendingId, action] = data.split('|');
    if (prefix !== SIGN_CALLBACK_PREFIX || !pendingId || !action)
        return null;
    return { pendingId, action };
};
const buildYesNoKeyboard = () => ({
    inline_keyboard: [
        [
            { text: 'Sí', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.yes) },
            { text: 'No', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.no) },
        ],
        [{ text: 'Cancelar', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.cancel) }],
    ],
});
const buildUnitTotalKeyboard = () => ({
    inline_keyboard: [
        [
            { text: 'Unitario', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.unit) },
            { text: 'Total', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.total) },
        ],
        [{ text: 'Cancelar', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.cancel) }],
    ],
});
const buildConfirmCancelKeyboard = () => ({
    inline_keyboard: [
        [
            { text: 'Confirmar', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.confirm) },
            { text: 'Cancelar', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.cancel) },
        ],
    ],
});
const buildGuidedVariantQtyKeyboard = (remaining, hasMoreVariants) => {
    const rows = [
        [0, 5, 10, 20].map((qty) => ({ text: String(qty), callback_data: buildGuidedCallbackData(buildGuidedVariantQtyAction(qty)) })),
    ];
    const actionsRow = [];
    if (remaining !== null && remaining > 0) {
        actionsRow.push({
            text: `Restante (${remaining})`,
            callback_data: buildGuidedCallbackData(buildGuidedVariantQtyAction(remaining)),
        });
    }
    actionsRow.push({ text: 'Otro valor', callback_data: buildGuidedCallbackData(GUIDED_VARIANT_ACTIONS.manual) });
    rows.push(actionsRow);
    if (hasMoreVariants) {
        rows.push([{ text: '0 al resto', callback_data: buildGuidedCallbackData(GUIDED_VARIANT_ACTIONS.fillZeros) }]);
    }
    rows.push([{ text: 'Cancelar', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.cancel) }]);
    return { inline_keyboard: rows };
};
const formatOptionalText = (value) => (value?.trim() ? value.trim() : 'sin dato');
const formatOptionalCurrency = (value) => (Number.isFinite(value) ? formatCurrency(value) : 'sin dato');
const formatOptionalDate = (value) => (value ? formatDate(value) : 'sin fecha');
const normalizePhoneInput = (value) => {
    const trimmed = value.trim();
    if (!trimmed)
        return '';
    let cleaned = trimmed.replace(/[^\d+]/g, '');
    if (cleaned.includes('+') && !cleaned.startsWith('+')) {
        cleaned = cleaned.replace(/\+/g, '');
    }
    return cleaned;
};
const normalizeCustomerDocumentInput = (value) => {
    const trimmed = value.trim();
    if (!trimmed)
        return '';
    return trimmed.replace(/\s+/g, '').replace(/[^\da-zA-Z-]/g, '');
};
const normalizeOptionalField = (value) => {
    const cleaned = value.trim();
    if (!cleaned)
        return null;
    const normalized = normalizeText(cleaned);
    if (normalized === 'sin' || normalized === 'no' || normalized === 'ninguno' || normalized === 'ninguna')
        return null;
    if (/\b(no tengo|sin dato|omitir|omitelo|saltar)\b/.test(normalized))
        return null;
    return cleaned;
};
const SIMPLE_GUIDED_VARIANT_ID = '__simple__';
const SIMPLE_GUIDED_VARIANT_ATTRIBUTE = 'presentacion';
const SIMPLE_GUIDED_VARIANT_VALUE = 'general';
const isGuidedSaleCommand = (value) => {
    const text = normalizeText(value);
    return /\b(venta guiada|registrar venta|nueva venta|crear venta|registrar una venta|guiame con una venta|guiame una venta|gu[ií]ame con una venta)\b/.test(text);
};
const isGuidedCustomerCommand = (value) => {
    const text = normalizeText(value);
    return /\b(gu[ií]ame para crear cliente|guiame para crear cliente|crear cliente guiado|crear cliente|nuevo cliente|registrar cliente)\b/.test(text);
};
const isGuidedInvoiceIssuerCommand = (value) => {
    const text = normalizeText(value);
    return /\b(llenar datos de la empresa|datos de la empresa|configurar datos de la empresa|configurar empresa|datos de factura|configurar factura)\b/.test(text);
};
const parseCustomerCreateMessage = (rawText) => {
    const text = rawText.trim();
    if (!text)
        return null;
    const normalized = normalizeText(text);
    const hasCreateKeyword = /\b(crear|nuevo|registrar|agregar)\s+cliente\b/.test(normalized) || /\bcliente\s+nuevo\b/.test(normalized);
    const hasLabels = /(cliente|nombre)\s*[:-]/i.test(text) ||
        /(cedula|c[eé]dula|documento|doc|dni|nit)\s*[:-]/i.test(text) ||
        /(telefono|tel|celular|cel|whatsapp|phone)\s*[:-]/i.test(text);
    if (!hasCreateKeyword && !hasLabels)
        return null;
    const documentLabelMatch = text.match(/(?:cedula|c[eé]dula|documento|doc|dni|nit)\s*[:-]\s*([^\n,;]+)/i);
    const documentRaw = documentLabelMatch?.[1]?.trim() ?? null;
    const documentNumber = documentRaw ? normalizeCustomerDocumentInput(documentRaw) : undefined;
    const phoneLabelMatch = text.match(/(?:telefono|tel|celular|cel|whatsapp|phone)\s*[:-]\s*([+()\d\s-]{7,})/i);
    const phoneRaw = phoneLabelMatch?.[1] ?? null;
    const phoneFallbackMatch = !phoneRaw && !documentRaw ? text.match(/(\+?\d[\d\s-]{6,})/) : null;
    let phone = phoneRaw ? normalizePhoneInput(phoneRaw) : phoneFallbackMatch ? normalizePhoneInput(phoneFallbackMatch[1]) : null;
    if (phone && phone.replace(/\D/g, '').length < 7) {
        phone = null;
    }
    const nameLabelMatch = text.match(/(?:cliente|nombre)\s*[:-]\s*([^\n,;]+)/i);
    let name = nameLabelMatch?.[1]?.trim() ?? null;
    const cityLabelMatch = text.match(/(?:ciudad|city)\s*[:-]\s*([^\n,;]+)/i);
    const city = cityLabelMatch?.[1]?.trim() ?? null;
    const addressLabelMatch = text.match(/(?:direccion|direcci[oó]n|address)\s*[:-]\s*([^\n,;]+)/i);
    const address = addressLabelMatch?.[1]?.trim() ?? null;
    if (!name && hasCreateKeyword) {
        let candidate = text;
        candidate = candidate.replace(/(?:crear|nuevo|registrar|agregar)\s+cliente/gi, '');
        candidate = candidate.replace(/cliente\s+nuevo/gi, '');
        if (documentRaw)
            candidate = candidate.replace(documentRaw, '');
        if (phoneRaw)
            candidate = candidate.replace(phoneRaw, '');
        if (phoneFallbackMatch)
            candidate = candidate.replace(phoneFallbackMatch[1], '');
        candidate = candidate.replace(/(?:cedula|c[eé]dula|documento|doc|dni|nit)\s*[:-]?/gi, '');
        candidate = candidate.replace(/(?:telefono|tel|celular|cel|whatsapp|phone)\s*[:-]?/gi, '');
        if (city)
            candidate = candidate.replace(city, '');
        if (address)
            candidate = candidate.replace(address, '');
        candidate = candidate.replace(/(?:ciudad|city)\s*[:-]?/gi, '');
        candidate = candidate.replace(/(?:direccion|direcci[oó]n|address)\s*[:-]?/gi, '');
        candidate = candidate.replace(/[,:;]+/g, ' ');
        candidate = candidate.replace(/\s{2,}/g, ' ').trim();
        if (candidate)
            name = candidate;
    }
    if (!name && !documentNumber && !phone && !city && !address)
        return null;
    return {
        name,
        documentNumber: documentNumber || null,
        phone,
        city: cityLabelMatch ? normalizeOptionalField(city ?? '') : undefined,
        address: addressLabelMatch ? normalizeOptionalField(address ?? '') : undefined,
    };
};
const isCustomerLookupCommand = (value) => {
    const text = normalizeText(value);
    return /\b(consultar|ver|buscar|detalle|detalles)\s+cliente\b/.test(text);
};
const parseCustomerLookupName = (value) => {
    const text = value.trim();
    if (!text)
        return null;
    const match = text.match(/(?:consultar|ver|buscar|detalle|detalles)\s+cliente\s*[:-]?\s*([^\n,;]+)/i) ?? text.match(/cliente\s*[:-]\s*([^\n,;]+)/i);
    return match?.[1]?.trim() ?? null;
};
const isFastSaleCommand = (value) => {
    const text = normalizeText(value);
    return /\b(venta rapida|venta rápida|registrar venta rapida|registrar venta rápida)\b/.test(text);
};
const isProductListCommand = (value) => {
    const text = normalizeText(value);
    return /\b(que productos tengo|que productos tienes|lista de productos|mis productos|productos disponibles)\b/.test(text);
};
const parseMoney = (value) => {
    const match = value.match(/\d[\d.,]*/);
    if (!match)
        return null;
    const raw = match[0].replace(/[^\d]/g, '');
    if (!raw)
        return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
};
const extractLargestMoney = (value) => {
    const matches = value.match(/\d[\d.,]*/g) ?? [];
    let best = 0;
    for (const match of matches) {
        const looksLikeMoney = match.includes('.') || match.includes(',') || match.replace(/[^\d]/g, '').length >= 4;
        if (!looksLikeMoney)
            continue;
        const parsed = parseMoney(match);
        if (parsed && parsed > best)
            best = parsed;
    }
    return best > 0 ? best : null;
};
const parseSingleQuantity = (value) => {
    const match = value.match(/\b\d+\b/);
    if (!match)
        return null;
    const qty = Number(match[0]);
    return Number.isFinite(qty) && qty > 0 ? qty : null;
};
const parseNonNegativeQuantity = (value) => {
    const cleaned = value.trim();
    if (!/^\d+$/.test(cleaned))
        return null;
    const qty = Number(cleaned);
    return Number.isInteger(qty) && qty >= 0 ? qty : null;
};
const parseExplicitSaleQty = (value) => {
    const patterns = [
        /(?:^|\b)venta(?:s)?\s+de\s+(\d{1,6})(?:\b|$)/i,
        /(?:^|\b)vend(?:i|í|imos|ieron|io|ió)\s+(\d{1,6})(?:\b|$)/i,
        /(?:^|\b)se\s+vend(?:io|ió|ieron)\s+(\d{1,6})(?:\b|$)/i,
        /^\s*(\d{1,6})(?=\s+[^\d])/i,
    ];
    for (const pattern of patterns) {
        const match = value.match(pattern);
        if (!match)
            continue;
        const qty = Number(match[1]);
        if (Number.isInteger(qty) && qty > 0)
            return qty;
    }
    return null;
};
const hasPackHintInSaleText = (value) => /(?:^|[\s(])x\s*\d{1,3}(?=\b|[^\d])/i.test(value) || /\bdocenas?\b/i.test(value);
const parseGuidedVariantPriceInput = (value) => {
    const explicitMatch = value.match(/(?:=|:)\s*([\d.,]+)/);
    if (explicitMatch) {
        const explicit = parseMoney(explicitMatch[1]);
        if (explicit && explicit > 0)
            return explicit;
    }
    const largest = extractLargestMoney(value);
    if (largest && largest > 0)
        return largest;
    const fallback = parseMoney(value);
    return fallback && fallback > 0 ? fallback : null;
};
const parseYesNo = (value) => {
    const text = normalizeText(value);
    const tokens = text.split(/[\s,.;:!?]+/).filter(Boolean);
    const hasNo = tokens.includes('no') || tokens.includes('n');
    const hasYes = tokens.includes('si') || tokens.includes('s');
    if (hasNo && !hasYes)
        return false;
    if (hasYes && !hasNo)
        return true;
    return null;
};
const parseDateInput = (value) => {
    const text = normalizeText(value);
    const now = new Date();
    if (text.includes('hoy')) {
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);
    }
    if (text.includes('manana') || text.includes('mañana')) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        d.setUTCDate(d.getUTCDate() + 1);
        return d.toISOString().slice(0, 10);
    }
    const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (isoMatch) {
        const d = new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
        return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
    const dmMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
    if (dmMatch) {
        const d = new Date(Date.UTC(Number(dmMatch[3]), Number(dmMatch[2]) - 1, Number(dmMatch[1])));
        return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
    return null;
};
const parseCreditDueTerm = (value) => {
    const text = normalizeText(value);
    if (!text)
        return null;
    if (/\bquincena\b/.test(text)) {
        return { amount: 15, unit: 'days' };
    }
    if (/^\d+$/.test(text)) {
        const amount = Number(text);
        return Number.isInteger(amount) && amount > 0 ? { amount, unit: 'days' } : null;
    }
    if (/\buna?\s+semana\b/.test(text)) {
        return { amount: 1, unit: 'weeks' };
    }
    if (/\buna?\s+mes\b/.test(text)) {
        return { amount: 1, unit: 'months' };
    }
    const compact = text.match(/\b(\d+)\s*(d|dias?|dia|semanas?|semana|sem|s|meses|mes|m)\b/);
    if (!compact)
        return null;
    const amount = Number(compact[1]);
    if (!Number.isInteger(amount) || amount <= 0)
        return null;
    const rawUnit = compact[2];
    if (/^m(?:es|eses)?$/.test(rawUnit)) {
        return { amount, unit: 'months' };
    }
    if (/^(?:sem|s|semana|semanas)$/.test(rawUnit)) {
        return { amount, unit: 'weeks' };
    }
    return { amount, unit: 'days' };
};
const addCreditTermToDate = (baseDate, amount, unit) => {
    const match = baseDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match)
        return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month, day));
    if (Number.isNaN(date.getTime()))
        return null;
    if (unit === 'months') {
        date.setUTCMonth(date.getUTCMonth() + amount);
    }
    else if (unit === 'weeks') {
        date.setUTCDate(date.getUTCDate() + amount * 7);
    }
    else {
        date.setUTCDate(date.getUTCDate() + amount);
    }
    return date.toISOString().slice(0, 10);
};
const parseCreditDueInput = (value, saleDate) => {
    const explicitDate = parseDateInput(value);
    if (explicitDate) {
        return { dueDate: explicitDate };
    }
    const term = parseCreditDueTerm(value);
    if (!term)
        return null;
    if (saleDate) {
        const dueDate = addCreditTermToDate(saleDate, term.amount, term.unit);
        if (dueDate)
            return { dueDate };
    }
    return { termAmount: term.amount, termUnit: term.unit };
};
const buildSaleDescription = (data) => {
    const parts = ['Venta Telegram'];
    if (data.customerName?.trim())
        parts.push(`Cliente: ${data.customerName.trim()}`);
    if (data.paymentMethod?.trim())
        parts.push(`Pago: ${data.paymentMethod.trim()}`);
    if (data.creditDueDate)
        parts.push(`Vence: ${data.creditDueDate}`);
    return parts.join(' | ');
};
const isCustomerBasedEvent = (eventType) => eventType === 'sale' || eventType === 'customer_payment';
const isSupplierBasedEvent = (eventType) => eventType === 'purchase' || eventType === 'supplier_payment';
const resolveDefaultDate = (date, periodHint) => {
    if (date)
        return date;
    if (periodHint) {
        const [year, month] = periodHint.split('-').map((v) => Number(v));
        if (year && month && month >= 1 && month <= 12) {
            return new Date(Date.UTC(year, month - 1, 1)).toISOString();
        }
    }
    return new Date().toISOString();
};
const resolveSalePreview = (sale) => {
    const quantity = sale.quantity ?? 0;
    let unitPrice = sale.unitPrice ?? null;
    let totalAmount = sale.totalAmount ?? null;
    if (unitPrice != null && quantity > 0 && totalAmount == null) {
        totalAmount = quantity * unitPrice;
    }
    if (totalAmount != null && quantity > 0 && unitPrice == null) {
        unitPrice = Math.round(totalAmount / quantity);
    }
    const date = resolveDefaultDate(sale.date ?? null, sale.periodHint ?? null);
    const paymentMethod = sale.paymentMethod?.trim() ? sale.paymentMethod : 'efectivo';
    return { quantity, unitPrice, totalAmount, date, paymentMethod };
};
const resolvePurchasePreview = (purchase) => {
    const date = resolveDefaultDate(purchase.date ?? null, purchase.periodHint ?? null);
    const paymentMethod = purchase.paymentMethod?.trim() ? purchase.paymentMethod : 'efectivo';
    return { date, paymentMethod };
};
const resolvePayrollPreview = (payroll) => {
    const date = resolveDefaultDate(payroll.date ?? null, payroll.periodHint ?? null);
    const paymentMethod = payroll.paymentMethod?.trim() ? payroll.paymentMethod : 'efectivo';
    return { date, paymentMethod };
};
const resolveCustomerPaymentPreview = (payment) => {
    const date = resolveDefaultDate(payment.date ?? null, payment.periodHint ?? null);
    const paymentMethod = payment.paymentMethod?.trim() ? payment.paymentMethod : 'efectivo';
    return { date, paymentMethod };
};
const resolveSupplierPaymentPreview = (payment) => {
    const date = resolveDefaultDate(payment.date ?? null, payment.periodHint ?? null);
    const paymentMethod = payment.paymentMethod?.trim() ? payment.paymentMethod : 'efectivo';
    return { date, paymentMethod };
};
const findSimilarCustomers = async (companyId, rawName) => {
    const normalized = normalizeText(rawName);
    if (!normalized)
        return { exactMatch: null, matches: [] };
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const searchTerm = tokens[0] ?? rawName;
    const { items } = await dependencies_1.arCustomerRepository.listByCompany(companyId, { search: searchTerm, limit: 50 });
    const exact = items.find((item) => normalizeText(item.name) === normalized) ?? null;
    if (exact)
        return { exactMatch: exact, matches: [] };
    const minLength = Math.ceil(normalized.length / 2);
    const inputTokens = tokens;
    const filtered = items.filter((item) => {
        const normalizedItem = normalizeText(item.name);
        if (!normalizedItem)
            return false;
        if (normalizedItem.length < minLength)
            return false;
        if (normalizedItem.includes(normalized) || normalized.startsWith(normalizedItem))
            return true;
        const itemTokens = normalizedItem.split(/\s+/).filter(Boolean);
        if (inputTokens.length === 0 || itemTokens.length === 0)
            return false;
        const common = inputTokens.filter((token) => itemTokens.includes(token)).length;
        const overlap = common / Math.max(inputTokens.length, itemTokens.length);
        return overlap >= 0.5;
    });
    return { exactMatch: null, matches: filtered };
};
const findSimilarSuppliers = async (companyId, rawName) => {
    const normalized = normalizeText(rawName);
    if (!normalized)
        return { exactMatch: null, matches: [] };
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const searchTerm = tokens[0] ?? rawName;
    const { items } = await dependencies_1.apSupplierRepository.listByCompany(companyId, { search: searchTerm, limit: 50 });
    const exact = items.find((item) => normalizeText(item.name) === normalized) ?? null;
    if (exact)
        return { exactMatch: exact, matches: [] };
    const minLength = Math.ceil(normalized.length / 2);
    const inputTokens = tokens;
    const filtered = items.filter((item) => {
        const normalizedItem = normalizeText(item.name);
        if (!normalizedItem)
            return false;
        if (normalizedItem.length < minLength)
            return false;
        if (normalizedItem.includes(normalized) || normalized.startsWith(normalizedItem))
            return true;
        const itemTokens = normalizedItem.split(/\s+/).filter(Boolean);
        if (inputTokens.length === 0 || itemTokens.length === 0)
            return false;
        const common = inputTokens.filter((token) => itemTokens.includes(token)).length;
        const overlap = common / Math.max(inputTokens.length, itemTokens.length);
        return overlap >= 0.5;
    });
    return { exactMatch: null, matches: filtered };
};
const buildPendingSummary = (params) => {
    const lines = ['Confirma la operacion', ''];
    if (params.eventType === 'sale') {
        const sale = params.data;
        const preview = resolveSalePreview(sale);
        lines.push('Tipo: Venta', `Descripcion: ${formatOptionalText(sale.description)}`, `Cantidad: ${preview.quantity > 0 ? preview.quantity : 'sin dato'}`, `Precio unitario: ${formatOptionalCurrency(preview.unitPrice ?? null)}`, `Total: ${formatOptionalCurrency(preview.totalAmount ?? null)}`, `Cliente detectado: ${formatOptionalText(sale.customerName)}`, `Forma de pago: ${formatOptionalText(preview.paymentMethod)}`, `Fecha: ${formatOptionalDate(preview.date)}`);
    }
    if (params.eventType === 'purchase') {
        const purchase = params.data;
        const preview = resolvePurchasePreview(purchase);
        lines.push('Tipo: Compra', `Descripcion: ${formatOptionalText(purchase.description)}`, `Monto: ${formatOptionalCurrency(purchase.amount ?? null)}`, `Proveedor detectado: ${formatOptionalText(purchase.supplier)}`, `Forma de pago: ${formatOptionalText(preview.paymentMethod)}`, `Fecha: ${formatOptionalDate(preview.date)}`);
    }
    if (params.eventType === 'payroll') {
        const payroll = params.data;
        const preview = resolvePayrollPreview(payroll);
        lines.push('Tipo: Nomina', `Monto: ${formatOptionalCurrency(payroll.amount ?? null)}`, `Forma de pago: ${formatOptionalText(preview.paymentMethod)}`, `Fecha: ${formatOptionalDate(preview.date)}`);
    }
    if (params.eventType === 'customer_payment') {
        const payment = params.data;
        const preview = resolveCustomerPaymentPreview(payment);
        lines.push('Tipo: Pago de cliente', `Cliente detectado: ${formatOptionalText(payment.customerName)}`, `Monto: ${formatOptionalCurrency(payment.amount ?? null)}`, `Forma de pago: ${formatOptionalText(preview.paymentMethod)}`, `Fecha: ${formatOptionalDate(preview.date)}`);
    }
    if (params.eventType === 'supplier_payment') {
        const payment = params.data;
        const preview = resolveSupplierPaymentPreview(payment);
        lines.push('Tipo: Pago a proveedor', `Proveedor detectado: ${formatOptionalText(payment.supplierName)}`, `Monto: ${formatOptionalCurrency(payment.amount ?? null)}`, `Forma de pago: ${formatOptionalText(preview.paymentMethod)}`, `Fecha: ${formatOptionalDate(preview.date)}`);
    }
    if (params.exactCustomerMatch) {
        lines.push('', `Cliente confirmado: ${params.exactCustomerMatch.name}`);
    }
    else if (params.customerMatches.length > 0) {
        lines.push('', 'Encontre un cliente similar:');
        for (const customer of params.customerMatches) {
            lines.push(`- ${customer.name}`);
        }
    }
    if (params.exactSupplierMatch) {
        lines.push('', `Proveedor confirmado: ${params.exactSupplierMatch.name}`);
    }
    else if (params.supplierMatches.length > 0) {
        lines.push('', 'Encontre un proveedor similar:');
        for (const supplier of params.supplierMatches) {
            lines.push(`- ${supplier.name}`);
        }
    }
    lines.push('', 'Que deseas hacer?');
    return lines.join('\n');
};
const buildPendingReplyMarkup = (params) => {
    const rows = [];
    const isCustomerEvent = isCustomerBasedEvent(params.eventType);
    const isSupplierEvent = isSupplierBasedEvent(params.eventType);
    const hasCustomerName = !!params.customerName?.trim();
    const hasSupplierName = !!params.supplierName?.trim();
    if (isCustomerEvent && params.exactCustomerMatch) {
        rows.push([
            {
                text: `Confirmar usando ${params.exactCustomerMatch.name}`,
                callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmCustomer, params.exactCustomerMatch.id),
            },
        ]);
    }
    else if (isCustomerEvent && hasCustomerName) {
        if (params.customerMatches.length > 0) {
            params.customerMatches.forEach((customer) => {
                rows.push([
                    {
                        text: `Confirmar usando ${customer.name}`,
                        callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmCustomer, customer.id),
                    },
                ]);
            });
        }
        rows.push([
            {
                text: `Crear nuevo cliente "${params.customerName?.trim()}"`,
                callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmNew),
            },
        ]);
    }
    else if (isSupplierEvent && params.exactSupplierMatch) {
        rows.push([
            {
                text: `Confirmar usando ${params.exactSupplierMatch.name}`,
                callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmSupplier, params.exactSupplierMatch.id),
            },
        ]);
    }
    else if (isSupplierEvent && hasSupplierName) {
        if (params.supplierMatches.length > 0) {
            params.supplierMatches.forEach((supplier) => {
                rows.push([
                    {
                        text: `Confirmar usando ${supplier.name}`,
                        callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmSupplier, supplier.id),
                    },
                ]);
            });
        }
        rows.push([
            {
                text: `Crear nuevo proveedor "${params.supplierName?.trim()}"`,
                callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirmNewSupplier),
            },
        ]);
    }
    else {
        rows.push([
            {
                text: 'Confirmar',
                callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.confirm),
            },
        ]);
    }
    rows.push([
        {
            text: 'Cancelar',
            callback_data: buildCallbackData(params.pendingId, CALLBACK_ACTIONS.cancel),
        },
    ]);
    return { inline_keyboard: rows };
};
const isAccountsReceivableEnabled = async (companyId) => {
    const settings = await dependencies_1.arSettingsRepository.getByCompanyId(companyId);
    return settings?.enabled ?? false;
};
const isAccountsPayableEnabled = async (companyId) => {
    const settings = await dependencies_1.apSettingsRepository.getByCompanyId(companyId);
    return settings?.enabled ?? false;
};
const getPeriodLabel = async (companyId, periodId) => {
    if (!periodId)
        return 'no asignado';
    const period = await dependencies_1.accountingPeriodRepository.findById(periodId);
    if (!period || period.companyId !== companyId)
        return periodId;
    return period.name ?? period.id;
};
const markPeriodPendingIfReopened = async (companyId, targetPeriodId) => {
    const meta = dependencies_1.resolvePeriodId.getLastResolutionMeta();
    if (!meta || !meta.reopenedClosed)
        return;
    if (targetPeriodId && meta.periodId !== targetPeriodId)
        return;
    const period = await dependencies_1.accountingPeriodRepository.findById(meta.periodId);
    if (!period || period.companyId !== companyId)
        return;
    if (period.status === AccountingPeriodStatus_1.AccountingPeriodStatus.CREATED)
        return;
    await dependencies_1.accountingPeriodRepository.save({ ...period, status: AccountingPeriodStatus_1.AccountingPeriodStatus.CREATED });
};
const createPendingEvent = async (params) => {
    const expiresAt = new Date(Date.now() + PENDING_EXPIRATION_MINUTES * 60 * 1000);
    const metadata = {
        ...(params.customerName ? { customerName: params.customerName } : {}),
        ...(params.supplierName ? { supplierName: params.supplierName } : {}),
    };
    const pending = await dependencies_1.pendingEventRepository.create({
        companyId: params.companyId,
        telegramUserId: params.chatId,
        eventType: params.eventType,
        interpretedData: params.interpretedData,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        status: 'PENDING_CONFIRMATION',
        expiresAt,
    });
    const { exactMatch: exactCustomerMatch, matches: customerMatches } = params.customerName && isCustomerBasedEvent(params.eventType) ? await findSimilarCustomers(params.companyId, params.customerName) : { exactMatch: null, matches: [] };
    const { exactMatch: exactSupplierMatch, matches: supplierMatches } = params.supplierName && isSupplierBasedEvent(params.eventType) ? await findSimilarSuppliers(params.companyId, params.supplierName) : { exactMatch: null, matches: [] };
    const summary = buildPendingSummary({
        eventType: params.eventType,
        data: params.interpretedData,
        customerMatches,
        exactCustomerMatch,
        supplierMatches,
        exactSupplierMatch,
    });
    const replyMarkup = buildPendingReplyMarkup({
        pendingId: pending.id,
        eventType: params.eventType,
        customerName: params.customerName,
        customerMatches,
        exactCustomerMatch,
        supplierName: params.supplierName,
        supplierMatches,
        exactSupplierMatch,
    });
    await telegramClient_1.TelegramClient.sendMessage({
        chatId: params.chatId,
        text: summary,
        parseMode: 'Markdown',
        replyMarkup,
    });
    return pending;
};
const getInvoiceSignatureMeta = (pending) => {
    const raw = pending.metadata ?? {};
    const token = typeof raw.token === 'string' ? raw.token : '';
    const rawStep = raw.step;
    const step = rawStep === 'customer' || rawStep === 'done' ? rawStep : 'seller';
    if (!token)
        return null;
    return {
        token,
        step,
        sellerSignatureDataUrl: typeof raw.sellerSignatureDataUrl === 'string' ? raw.sellerSignatureDataUrl : null,
        customerSignatureDataUrl: typeof raw.customerSignatureDataUrl === 'string' ? raw.customerSignatureDataUrl : null,
        sellerSignedAt: typeof raw.sellerSignedAt === 'string' ? raw.sellerSignedAt : null,
        customerSignedAt: typeof raw.customerSignedAt === 'string' ? raw.customerSignedAt : null,
    };
};
const completeSignedInvoiceForPending = async (pending, meta) => {
    const invoice = pending.interpretedData;
    const companyId = invoice.companyId ?? pending.companyId;
    const companySettings = await dependencies_1.invoiceIssuerSettingsRepository.getByCompanyId(companyId);
    const invoiceBuffer = await (0, invoicePdfGenerator_1.generateInvoicePdfBuffer)({
        companyId,
        companyName: invoice.companyName ?? companySettings?.companyName ?? null,
        companyTaxId: invoice.companyTaxId ?? companySettings?.taxId ?? null,
        companyPhone: invoice.companyPhone ?? companySettings?.contactPhone ?? null,
        companyAddress: invoice.companyAddress ?? companySettings?.address ?? null,
        customerName: invoice.customerName ?? null,
        customerDocumentNumber: invoice.customerDocumentNumber ?? null,
        customerPhone: invoice.customerPhone ?? null,
        customerCity: invoice.customerCity ?? null,
        customerAddress: invoice.customerAddress ?? null,
        date: invoice.date,
        paymentMethod: invoice.paymentMethod ?? null,
        creditDueDate: invoice.creditDueDate ?? null,
        totalAmount: Number(invoice.totalAmount ?? 0),
        downPaymentAmount: Number(invoice.downPaymentAmount ?? 0),
        showCreditBreakdown: Boolean(invoice.showCreditBreakdown),
        items: Array.isArray(invoice.items) ? invoice.items : [],
        sellerSignatureDataUrl: meta.sellerSignatureDataUrl ?? null,
        sellerSignatureLabel: invoice.sellerName ?? 'Vendedor',
        sellerSignedAt: meta.sellerSignedAt ?? null,
        customerSignatureDataUrl: meta.customerSignatureDataUrl ?? null,
        customerSignatureLabel: invoice.customerName ?? 'Cliente',
        customerSignedAt: meta.customerSignedAt ?? null,
    });
    const invoiceFilename = invoice.invoiceFilename || `factura-${invoice.date}.pdf`;
    await telegramClient_1.TelegramClient.sendDocument({
        chatId: pending.telegramUserId,
        file: invoiceBuffer,
        filename: invoiceFilename,
    });
    if (invoice.customerPhone) {
        const customerCaptionName = invoice.customerName ?? 'cliente';
        const whatsappResult = await whatsappClient_1.WhatsAppClient.sendInvoiceDocument({
            phone: invoice.customerPhone,
            file: invoiceBuffer,
            filename: invoiceFilename,
            caption: `Factura de ${customerCaptionName}`,
        });
        if (whatsappResult.ok) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId: pending.telegramUserId,
                text: `✅ Factura firmada enviada por WhatsApp al cliente (${invoice.customerPhone}).`,
            });
        }
        else if (whatsappResult.reason === 'send_error') {
            console.error('Error enviando factura firmada por WhatsApp:', whatsappResult.error);
            await telegramClient_1.TelegramClient.sendMessage({
                chatId: pending.telegramUserId,
                text: '⚠️ La factura firmada se generó, pero no pude enviarla por WhatsApp.',
            });
        }
    }
};
const startInvoiceSignatureFlow = async (params) => {
    const existing = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(params.chatId, 'invoice_signature');
    if (existing?.status === 'PENDING_CONFIRMATION') {
        await dependencies_1.pendingEventRepository.updateStatus(existing.id, 'CANCELLED');
    }
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const token = createSignatureToken();
    const pending = await dependencies_1.pendingEventRepository.create({
        companyId: params.companyId,
        telegramUserId: params.chatId,
        eventType: 'invoice_signature',
        interpretedData: params.invoice,
        metadata: {
            token,
            step: 'seller',
            sellerSignatureDataUrl: null,
            customerSignatureDataUrl: null,
            sellerSignedAt: null,
            customerSignedAt: null,
        },
        status: 'PENDING_CONFIRMATION',
        expiresAt,
    });
    const signUrl = `${getSignatureFrontendBaseUrl()}/telegram-sign/${pending.id}?token=${token}`;
    const canOpenDirectly = canUseTelegramUrlButton(signUrl);
    const firstRow = canOpenDirectly ? [{ text: 'Abrir firma', url: signUrl }] : [];
    const secondRow = [{ text: 'Copiar enlace', copy_text: { text: signUrl } }];
    const thirdRow = [{ text: 'Ver enlace', callback_data: buildSignCallbackData(pending.id, SIGN_CALLBACK_ACTIONS.copy) }];
    await telegramClient_1.TelegramClient.sendMessage({
        chatId: params.chatId,
        text: `🖊️ Firma pendiente\n\n1) Firma vendedor\n2) Firma cliente\n\n${canOpenDirectly ? 'Toca "Abrir firma" para continuar.' : 'Si no abre directo, usa "Copiar enlace".'}\n\nSi necesitas cancelar: escribe "cancelar firma".`,
        replyMarkup: {
            inline_keyboard: [...(firstRow.length ? [firstRow] : []), [secondRow[0]], [thirdRow[0]]],
        },
    });
};
const getGuidedSaleState = (pending) => {
    const rawData = pending.interpretedData ?? {};
    const rawMeta = pending.metadata ?? {};
    const data = {
        saleId: typeof rawData.saleId === 'string' && rawData.saleId.trim() ? rawData.saleId : dependencies_1.inventoryGateway.idGenerator(),
        customerName: typeof rawData.customerName === 'string' ? rawData.customerName : null,
        paymentMethod: typeof rawData.paymentMethod === 'string' ? rawData.paymentMethod : null,
        creditDueDate: typeof rawData.creditDueDate === 'string' ? rawData.creditDueDate : null,
        date: typeof rawData.date === 'string' ? rawData.date : null,
        downPaymentAmount: typeof rawData.downPaymentAmount === 'number' ? rawData.downPaymentAmount : null,
        unitPrice: typeof rawData.unitPrice === 'number' ? rawData.unitPrice : null,
        totalAmount: typeof rawData.totalAmount === 'number' ? rawData.totalAmount : null,
        items: Array.isArray(rawData.items)
            ? rawData.items.map((item) => ({
                productId: String(item.productId ?? ''),
                productName: String(item.productName ?? ''),
                variants: Array.isArray(item.variants)
                    ? item.variants.map((variant) => ({
                        variantId: String(variant.variantId ?? ''),
                        attribute: String(variant.attribute ?? ''),
                        value: String(variant.value ?? ''),
                        qty: Number(variant.qty ?? 0),
                        unitPrice: typeof variant.unitPrice === 'number' ? Number(variant.unitPrice) : null,
                    }))
                    : [],
            }))
            : [],
    };
    const meta = {
        step: rawMeta.step ?? 'customer',
        inventoryMode: rawMeta.inventoryMode === 'SIMPLE' || rawMeta.inventoryMode === 'VARIANT' ? rawMeta.inventoryMode : undefined,
        candidateProducts: Array.isArray(rawMeta.candidateProducts)
            ? rawMeta.candidateProducts.map((item) => ({
                id: String(item.id ?? ''),
                name: String(item.name ?? ''),
            }))
            : undefined,
        candidateVariants: Array.isArray(rawMeta.candidateVariants)
            ? rawMeta.candidateVariants.map((item) => ({
                id: String(item.id ?? ''),
                attribute: String(item.attribute ?? ''),
                value: String(item.value ?? ''),
            }))
            : undefined,
        currentProductId: typeof rawMeta.currentProductId === 'string' ? rawMeta.currentProductId : undefined,
        currentProductName: typeof rawMeta.currentProductName === 'string' ? rawMeta.currentProductName : undefined,
        variantWizardIndex: typeof rawMeta.variantWizardIndex === 'number' ? rawMeta.variantWizardIndex : null,
        variantWizardValues: Array.isArray(rawMeta.variantWizardValues)
            ? rawMeta.variantWizardValues.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item >= 0)
            : null,
        pendingPriceAmount: typeof rawMeta.pendingPriceAmount === 'number' ? rawMeta.pendingPriceAmount : null,
        pendingPriceScope: rawMeta.pendingPriceScope === 'unit' || rawMeta.pendingPriceScope === 'total' ? rawMeta.pendingPriceScope : null,
        pendingCreditTermAmount: typeof rawMeta.pendingCreditTermAmount === 'number' ? rawMeta.pendingCreditTermAmount : null,
        pendingCreditTermUnit: rawMeta.pendingCreditTermUnit === 'days' || rawMeta.pendingCreditTermUnit === 'weeks' || rawMeta.pendingCreditTermUnit === 'months'
            ? rawMeta.pendingCreditTermUnit
            : null,
        fastMode: typeof rawMeta.fastMode === 'boolean' ? rawMeta.fastMode : undefined,
        pendingPriceProductIds: Array.isArray(rawMeta.pendingPriceProductIds) ? rawMeta.pendingPriceProductIds.map((item) => String(item)) : undefined,
        pendingTotalQty: typeof rawMeta.pendingTotalQty === 'number' ? rawMeta.pendingTotalQty : null,
        autoPriceApply: typeof rawMeta.autoPriceApply === 'boolean' ? rawMeta.autoPriceApply : undefined,
        skipAddMore: typeof rawMeta.skipAddMore === 'boolean' ? rawMeta.skipAddMore : undefined,
    };
    return { data, meta };
};
const updateGuidedSaleState = async (pendingId, data, meta) => {
    await dependencies_1.pendingEventRepository.updateData(pendingId, data, meta);
};
const askGuidedSaleVariantQuantityStep = async (chatId, productName, variants, index, values, totalQty) => {
    const current = variants[index];
    if (!current)
        return;
    const assigned = values.slice(0, index).reduce((sum, qty) => sum + qty, 0);
    const progress = `${index + 1}/${variants.length}`;
    const totalLine = totalQty && totalQty > 0
        ? `\n🎯 Objetivo: ${totalQty}\n✅ Acumulado: ${assigned}\n⏳ Restante: ${Math.max(totalQty - assigned, 0)}`
        : '';
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: `🧵 *${productName}*\n` +
            `📌 Variante actual: *${current.attribute} ${current.value}*\n` +
            `📍 Progreso: ${progress}${totalLine}\n\n` +
            `✍️ Escribe solo la cantidad para *${current.attribute} ${current.value}*.\n` +
            'Ejemplo: `0`, `3`, `10`',
        parseMode: 'Markdown',
    });
};
const askGuidedSaleCustomer = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿A quién le vendiste? (nombre del cliente) \nSi no hay cliente, escribe: "sin cliente".',
    });
};
const askGuidedSaleProduct = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Qué producto vendiste? Escribe el nombre o una parte del nombre.',
    });
};
const isSimpleGuidedSale = (meta) => meta.inventoryMode === 'SIMPLE';
const shouldBypassGuidedAddMore = (meta) => meta.skipAddMore === true || (meta.fastMode === true && !isSimpleGuidedSale(meta));
const buildSimpleGuidedVariant = (qty, unitPrice = null) => ({
    variantId: SIMPLE_GUIDED_VARIANT_ID,
    attribute: SIMPLE_GUIDED_VARIANT_ATTRIBUTE,
    value: SIMPLE_GUIDED_VARIANT_VALUE,
    qty,
    unitPrice,
});
const isSimpleGuidedVariant = (variant) => variant.variantId === SIMPLE_GUIDED_VARIANT_ID ||
    (normalizeText(variant.attribute) === SIMPLE_GUIDED_VARIANT_ATTRIBUTE && normalizeText(variant.value) === SIMPLE_GUIDED_VARIANT_VALUE);
const askGuidedSaleQuantity = async (chatId, productName, suggestedQty) => {
    const suggestion = suggestedQty && suggestedQty > 0
        ? `\nCantidad detectada: ${Math.round(suggestedQty)}. Puedes confirmarla o escribir otra.`
        : '';
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: `📦 *${productName}*\n` +
            '¿Cuántas unidades vendiste?\n' +
            'Escribe solo el número. Ejemplo: `12`' +
            suggestion,
        parseMode: 'Markdown',
    });
};
const moveGuidedSaleToQuantityStep = async (pendingId, chatId, data, meta, productId, productName) => {
    meta.currentProductId = productId;
    meta.currentProductName = productName;
    meta.candidateVariants = undefined;
    meta.candidateProducts = undefined;
    clearGuidedVariantWizard(meta);
    meta.step = 'quantity';
    await updateGuidedSaleState(pendingId, data, meta);
    await askGuidedSaleQuantity(chatId, productName, meta.pendingTotalQty ?? null);
};
const askGuidedSaleVariants = async (chatId, productName, variants, totalQty) => {
    const list = variants.map((variant, index) => `${index + 1}) ${variant.attribute} ${variant.value}`).join('\n');
    const totalLine = totalQty && totalQty > 0 ? `\nCantidad total detectada: ${totalQty}.` : '';
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: `📦 *Variantes de ${productName}*\n\n` +
            `Estas son las variantes disponibles:\n${list}${totalLine}\n\n` +
            '✅ Para evitar errores, te las pediré una por una.',
        parseMode: 'Markdown',
    });
    await askGuidedSaleVariantQuantityStep(chatId, productName, variants, 0, variants.map(() => 0), totalQty);
};
const askGuidedSaleAddMore = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Deseas agregar otro producto?',
        replyMarkup: buildYesNoKeyboard(),
    });
};
const askGuidedSalePrice = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿El precio es igual para todas las variantes de este producto? (si/no)',
        replyMarkup: buildYesNoKeyboard(),
    });
};
const askGuidedSalePriceType = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Ese valor es *unitario* o *total*?',
        parseMode: 'Markdown',
        replyMarkup: buildUnitTotalKeyboard(),
    });
};
const askGuidedSalePriceValue = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuál es el precio? Puedes decir: "70000 cada uno" o "70000 total".',
    });
};
const askGuidedSaleVariantPrices = async (chatId, productName, variants) => {
    const list = variants.map((variant, index) => `${index + 1}) ${variant.attribute} ${variant.value}`).join('\n');
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: `💵 *Precios por variante de ${productName}*\n\n` +
            `Estas son las variantes disponibles:\n${list}\n\n` +
            '✅ Te los voy a pedir uno por uno para evitar errores.',
        parseMode: 'Markdown',
    });
};
const askGuidedSaleVariantPriceStep = async (chatId, productName, variants, prices, index) => {
    const current = variants[index];
    if (!current)
        return;
    const progress = `${index + 1}/${variants.length}`;
    const pricedCount = prices.filter((price) => Number.isFinite(price) && price > 0).length;
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: `💵 *${productName}*\n` +
            `🏷️ Talla: *${current.attribute} ${current.value}*\n` +
            `📍 Progreso: ${progress}\n` +
            `✅ Precios registrados: ${pricedCount}/${variants.length}\n\n` +
            `¿A cómo vendes *${current.attribute} ${current.value}*?\n` +
            'Ejemplo: `38000`',
        parseMode: 'Markdown',
    });
};
const askGuidedSalePayment = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cómo acordaron el pago? (efectivo, transferencia, crédito)',
    });
};
const askGuidedSaleCreditDueDate = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Qué plazo tiene para pagar? ⏳\n' +
            'Puedes responder así:\n' +
            '• `15 dias`, `1 semana`, `1 mes`, `3 meses`\n' +
            '• o una fecha exacta: `2026-04-20`',
        parseMode: 'Markdown',
    });
};
const askGuidedSaleDate = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuándo fue la venta? (YYYY-MM-DD o "hoy")',
    });
};
const askGuidedSaleDownPayment = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Se hizo algún abono inicial?',
        replyMarkup: buildYesNoKeyboard(),
    });
};
const askGuidedSaleDownPaymentAmount = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuánto fue el abono? (solo número, ej: 200000)',
    });
};
const buildGuidedSaleSummary = (data, totalAmount) => {
    const totalQty = computeTotalQty(data);
    const downPaymentAmount = Math.max(0, Math.round(Number(data.downPaymentAmount ?? 0)));
    const pendingAmount = Math.max(0, totalAmount - downPaymentAmount);
    const isCreditSale = /credito|cr[eé]dito/.test(normalizeText(data.paymentMethod ?? ''));
    const lines = ['🧾 *Resumen de la venta*', ''];
    lines.push(`Cliente: ${formatOptionalText(data.customerName ?? null)}`);
    lines.push(`Fecha: ${formatOptionalDate(data.date ?? null)}`);
    lines.push(`Forma de pago: ${formatOptionalText(data.paymentMethod ?? null)}`);
    if (data.creditDueDate) {
        lines.push(`Fecha límite de pago: ${formatOptionalDate(data.creditDueDate)}`);
    }
    lines.push(`Unidades totales: ${totalQty}`);
    lines.push(`Total de la venta: ${formatCurrency(totalAmount)}`);
    if (isCreditSale) {
        lines.push(`Abono inicial: ${formatCurrency(downPaymentAmount)}`);
        lines.push(`Saldo pendiente: ${formatCurrency(pendingAmount)}`);
    }
    lines.push('');
    lines.push('*Detalle por producto:*');
    if (data.items.length === 0) {
        lines.push('- Sin productos');
    }
    else {
        data.items.forEach((item, index) => {
            lines.push(`${index + 1}. ${item.productName}`);
            let productSubtotal = 0;
            if (item.variants.length === 0) {
                lines.push('   - Sin variantes');
            }
            else {
                item.variants.forEach((variant) => {
                    const variantLabel = isSimpleGuidedVariant(variant) ? 'Unidades' : `${variant.attribute} ${variant.value}`.trim();
                    const unitPrice = variant.unitPrice && variant.unitPrice > 0 ? Math.round(variant.unitPrice) : 0;
                    const lineTotal = unitPrice > 0 ? unitPrice * variant.qty : 0;
                    productSubtotal += lineTotal;
                    if (unitPrice > 0) {
                        lines.push(`   - ${variantLabel}: ${variant.qty} x ${formatCurrency(unitPrice)} = ${formatCurrency(lineTotal)}`);
                        return;
                    }
                    lines.push(`   - ${variantLabel}: ${variant.qty}`);
                });
            }
            if (productSubtotal > 0) {
                lines.push(`   Subtotal: ${formatCurrency(productSubtotal)}`);
            }
            lines.push('');
        });
        if (lines[lines.length - 1] === '')
            lines.pop();
    }
    lines.push('');
    lines.push('Si todo está correcto, responde *confirmar*.');
    lines.push('Si deseas salir sin guardar, responde *cancelar*.');
    return lines.join('\n');
};
const hasGuidedSaleCustomer = (data) => {
    const name = data.customerName?.trim();
    if (!name)
        return false;
    return normalizeText(name) !== 'sin cliente';
};
const isGuidedSaleCredit = (data) => /credito|cr[eé]dito/.test(normalizeText(data.paymentMethod ?? ''));
const shouldCaptureGuidedDownPayment = (data) => hasGuidedSaleCustomer(data) && isGuidedSaleCredit(data);
const sendGuidedSaleConfirmation = async (pendingId, chatId, data, meta) => {
    meta.step = 'confirm';
    await updateGuidedSaleState(pendingId, data, meta);
    const totalAmount = Math.round(computeTotalAmount(data));
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: buildGuidedSaleSummary(data, totalAmount),
        parseMode: 'Markdown',
        replyMarkup: buildConfirmCancelKeyboard(),
    });
};
const parseVariantQuantities = (text, variants) => {
    const normalized = normalizeText(text);
    const result = [];
    const pairs = [];
    const pairRegex = /([a-zA-Z0-9]+)\s*(?:[:=]|\|)\s*(\d+)/g;
    let match = pairRegex.exec(normalized);
    while (match !== null) {
        const key = match[1];
        const qty = Number(match[2]);
        if (!Number.isFinite(qty) || qty <= 0)
            continue;
        pairs.push({ key, qty });
        match = pairRegex.exec(normalized);
    }
    const attributes = Array.from(new Set(variants.map((variant) => normalizeText(variant.attribute))));
    const valueSet = new Set(variants.map((variant) => normalizeText(variant.value)));
    if (pairs.length === 0) {
        const tokens = normalized.split(/[\s,;]+/).filter(Boolean);
        const allNumericTokens = tokens.every((token) => /^\d+$/.test(token));
        if (!allNumericTokens) {
            for (let i = 0; i < tokens.length - 1; i += 1) {
                const key = tokens[i];
                const qtyToken = tokens[i + 1];
                const qty = Number(qtyToken);
                if (!Number.isFinite(qty))
                    continue;
                let cleaned = key;
                attributes.forEach((attr) => {
                    if (attr && cleaned.startsWith(`${attr} `)) {
                        cleaned = cleaned.slice(attr.length + 1);
                    }
                });
                if (valueSet.has(cleaned)) {
                    pairs.push({ key: cleaned, qty });
                }
            }
        }
    }
    if (pairs.length === 0) {
        const numbers = normalized
            .match(/\d+/g)
            ?.map(Number)
            .filter((n) => Number.isFinite(n)) ?? [];
        if (numbers.length === variants.length) {
            numbers.forEach((qty, index) => {
                if (qty <= 0)
                    return;
                pairs.push({ key: String(index + 1), qty });
            });
        }
    }
    const indexMap = new Map();
    variants.forEach((variant, index) => {
        indexMap.set(index + 1, variant);
    });
    pairs.forEach((pair) => {
        const asIndex = Number(pair.key);
        if (Number.isFinite(asIndex) && indexMap.has(asIndex)) {
            const variant = indexMap.get(asIndex);
            if (variant) {
                result.push({
                    variantId: variant.id,
                    attribute: variant.attribute,
                    value: variant.value,
                    qty: pair.qty,
                    unitPrice: null,
                });
            }
            return;
        }
        const key = pair.key;
        const keyNormalized = normalizeText(key);
        let cleaned = keyNormalized;
        attributes.forEach((attr) => {
            if (attr && cleaned.startsWith(`${attr} `)) {
                cleaned = cleaned.slice(attr.length + 1);
            }
        });
        const matched = variants.find((variant) => normalizeText(variant.value) === cleaned);
        if (matched) {
            result.push({
                variantId: matched.id,
                attribute: matched.attribute,
                value: matched.value,
                qty: pair.qty,
                unitPrice: null,
            });
        }
    });
    return result;
};
const computeTotalQty = (data) => data.items.reduce((sum, item) => sum + item.variants.reduce((inner, variant) => inner + variant.qty, 0), 0);
const computeTotalAmount = (data) => data.items.reduce((sum, item) => sum + item.variants.reduce((inner, variant) => inner + (variant.unitPrice ? variant.unitPrice * variant.qty : 0), 0), 0);
const allVariantsPriced = (data) => data.items.every((item) => item.variants.every((variant) => variant.unitPrice && variant.unitPrice > 0));
const toSafeQty = (value) => {
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
    if (!Number.isFinite(parsed))
        return null;
    return Math.max(0, Math.round(parsed));
};
const formatInventoryConfirmErrorMessage = (data, error) => {
    const errorType = error?.type ?? 'Error';
    if (errorType !== 'InsufficientStock') {
        return `No pude confirmar inventario: ${errorType}. Ajusta las cantidades e intenta de nuevo.`;
    }
    const item = error.productId ? data.items.find((entry) => entry.productId === error.productId) : null;
    const variant = error.variantId ? item?.variants.find((entry) => entry.variantId === error.variantId) : null;
    const productLabel = item?.productName?.trim() || (error.productId ? `ID ${error.productId}` : 'sin dato');
    const variantLabel = variant
        ? isSimpleGuidedVariant(variant)
            ? 'General'
            : `${variant.attribute} ${variant.value}`.trim()
        : error.variantId
            ? `ID ${error.variantId}`
            : 'sin dato';
    const requestedQty = toSafeQty(error.requestedQty) ?? (variant ? toSafeQty(variant.qty) : null);
    const availableQty = toSafeQty(error.availableQty);
    const missingQty = requestedQty !== null && availableQty !== null ? Math.max(0, requestedQty - availableQty) : null;
    const lines = ['No pude confirmar inventario por stock insuficiente.', `Producto: ${productLabel}`, `Referencia: ${variantLabel}`];
    if (requestedQty !== null)
        lines.push(`Solicitado: ${requestedQty}`);
    if (availableQty !== null)
        lines.push(`Disponible: ${availableQty}`);
    if (missingQty !== null)
        lines.push(`Faltan: ${missingQty}`);
    lines.push('Ajusta esa cantidad y vuelve a confirmar.');
    return lines.join('\n');
};
const advanceAfterItems = async (pendingId, chatId, data, meta) => {
    meta.currentProductId = undefined;
    meta.currentProductName = undefined;
    meta.candidateVariants = undefined;
    meta.candidateProducts = undefined;
    meta.variantWizardIndex = null;
    meta.variantWizardValues = null;
    if (!allVariantsPriced(data)) {
        const nextItem = data.items.find((item) => item.variants.some((variant) => !variant.unitPrice || variant.unitPrice <= 0));
        if (nextItem) {
            meta.currentProductId = nextItem.productId;
            meta.currentProductName = nextItem.productName;
            meta.candidateVariants = buildCandidateVariantsFromItem(nextItem);
            meta.step = isSimpleGuidedSale(meta) ? 'price_same' : 'price_mode';
            await updateGuidedSaleState(pendingId, data, meta);
            if (isSimpleGuidedSale(meta)) {
                await askGuidedSalePriceValue(chatId);
            }
            else {
                await askGuidedSalePrice(chatId);
            }
            return true;
        }
    }
    if (data.paymentMethod && /credito|cr[eÃƒÂ©]dito/.test(normalizeText(data.paymentMethod)) && !data.creditDueDate) {
        meta.step = 'credit_due';
        await updateGuidedSaleState(pendingId, data, meta);
        await askGuidedSaleCreditDueDate(chatId);
        return true;
    }
    if (!data.paymentMethod) {
        meta.step = 'payment';
        await updateGuidedSaleState(pendingId, data, meta);
        await askGuidedSalePayment(chatId);
        return true;
    }
    if (!data.date) {
        meta.step = 'date';
        await updateGuidedSaleState(pendingId, data, meta);
        await askGuidedSaleDate(chatId);
        return true;
    }
    if (shouldCaptureGuidedDownPayment(data)) {
        meta.step = 'down_payment_confirm';
        await updateGuidedSaleState(pendingId, data, meta);
        await askGuidedSaleDownPayment(chatId);
        return true;
    }
    data.downPaymentAmount = 0;
    await sendGuidedSaleConfirmation(pendingId, chatId, data, meta);
    return true;
};
const resetGuidedVariantWizard = (meta, totalVariants) => {
    meta.variantWizardIndex = 0;
    meta.variantWizardValues = Array.from({ length: totalVariants }, () => 0);
};
const clearGuidedVariantWizard = (meta) => {
    meta.variantWizardIndex = null;
    meta.variantWizardValues = null;
};
const resetGuidedPriceVariantWizard = (meta, variants, item) => {
    const values = variants.map((variant) => {
        const priced = item?.variants.find((entry) => entry.variantId === variant.id);
        const unitPrice = Number(priced?.unitPrice ?? 0);
        return Number.isFinite(unitPrice) && unitPrice > 0 ? Math.round(unitPrice) : 0;
    });
    const firstMissing = values.findIndex((value) => value <= 0);
    meta.variantWizardValues = values;
    meta.variantWizardIndex = firstMissing >= 0 ? firstMissing : 0;
};
const applyGuidedVariantSelection = async (pendingId, chatId, data, meta, variants) => {
    const currentProductId = meta.currentProductId;
    const currentProductName = meta.currentProductName;
    if (!currentProductId || !currentProductName) {
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude identificar el producto actual. Intenta de nuevo.' });
        return true;
    }
    const existing = data.items.find((item) => item.productId === currentProductId);
    if (existing) {
        const merge = new Map(existing.variants.map((variant) => [variant.variantId, variant]));
        variants.forEach((variant) => {
            const current = merge.get(variant.variantId);
            if (current) {
                current.qty += variant.qty;
            }
            else {
                merge.set(variant.variantId, { ...variant });
            }
        });
        existing.variants = Array.from(merge.values());
    }
    else {
        data.items.push({
            productId: currentProductId,
            productName: currentProductName,
            variants,
        });
    }
    if (!meta.autoPriceApply && (data.unitPrice || data.totalAmount)) {
        meta.pendingPriceAmount = data.unitPrice ?? data.totalAmount ?? null;
        meta.pendingPriceScope = data.unitPrice ? 'unit' : 'total';
        meta.autoPriceApply = true;
    }
    meta.pendingTotalQty = null;
    clearGuidedVariantWizard(meta);
    if (meta.autoPriceApply && meta.pendingPriceAmount && meta.pendingPriceAmount > 0) {
        const targetItem = data.items.find((item) => item.productId === currentProductId);
        if (targetItem) {
            const totalQty = targetItem.variants.reduce((sum, variant) => sum + variant.qty, 0);
            const unitPrice = meta.pendingPriceScope === 'total' ? (totalQty > 0 ? Math.round(meta.pendingPriceAmount / totalQty) : 0) : meta.pendingPriceAmount;
            if (unitPrice > 0) {
                targetItem.variants = targetItem.variants.map((variant) => ({ ...variant, unitPrice }));
            }
        }
        const appliedItem = data.items.find((item) => item.productId === currentProductId);
        const appliedOk = appliedItem?.variants.every((variant) => variant.unitPrice && variant.unitPrice > 0);
        if (!appliedOk) {
            meta.autoPriceApply = false;
            meta.pendingPriceAmount = null;
            meta.pendingPriceScope = null;
            meta.step = isSimpleGuidedSale(meta) ? 'price_same' : 'price_mode';
            await updateGuidedSaleState(pendingId, data, meta);
            if (isSimpleGuidedSale(meta)) {
                await askGuidedSalePriceValue(chatId);
            }
            else {
                await askGuidedSalePrice(chatId);
            }
            return true;
        }
        meta.pendingPriceAmount = null;
        meta.pendingPriceScope = null;
        meta.autoPriceApply = false;
        data.unitPrice = null;
        data.totalAmount = null;
        if (shouldBypassGuidedAddMore(meta)) {
            return await advanceAfterItems(pendingId, chatId, data, meta);
        }
        meta.step = 'add_more';
        meta.currentProductId = undefined;
        meta.currentProductName = undefined;
        meta.candidateVariants = undefined;
        meta.candidateProducts = undefined;
        clearGuidedVariantWizard(meta);
        await updateGuidedSaleState(pendingId, data, meta);
        await askGuidedSaleAddMore(chatId);
        return true;
    }
    if (data.unitPrice || data.totalAmount) {
        meta.step = 'price_apply_parsed';
        await updateGuidedSaleState(pendingId, data, meta);
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: 'Detecte un precio en tu mensaje. ¿Aplica para este producto?',
            replyMarkup: buildYesNoKeyboard(),
        });
        return true;
    }
    meta.step = isSimpleGuidedSale(meta) ? 'price_same' : 'price_mode';
    await updateGuidedSaleState(pendingId, data, meta);
    if (isSimpleGuidedSale(meta)) {
        await askGuidedSalePriceValue(chatId);
    }
    else {
        await askGuidedSalePrice(chatId);
    }
    return true;
};
const continueAfterGuidedVariantPrices = async (pendingId, chatId, data, meta) => {
    if (meta.fastMode) {
        const remaining = (meta.pendingPriceProductIds ?? []).filter((id) => id !== meta.currentProductId);
        meta.pendingPriceProductIds = remaining;
        if (remaining.length > 0) {
            const nextId = remaining[0];
            const nextItem = data.items.find((item) => item.productId === nextId);
            if (nextItem) {
                meta.currentProductId = nextItem.productId;
                meta.currentProductName = nextItem.productName;
                meta.candidateVariants = buildCandidateVariantsFromItem(nextItem);
                meta.step = isSimpleGuidedSale(meta) ? 'price_same' : 'price_mode';
                clearGuidedVariantWizard(meta);
                await updateGuidedSaleState(pendingId, data, meta);
                if (isSimpleGuidedSale(meta)) {
                    await askGuidedSalePriceValue(chatId);
                }
                else {
                    await askGuidedSalePrice(chatId);
                }
                return true;
            }
        }
        meta.currentProductId = undefined;
        meta.currentProductName = undefined;
        meta.candidateVariants = undefined;
        meta.candidateProducts = undefined;
        clearGuidedVariantWizard(meta);
        if (data.paymentMethod && /credito|cr[eé]dito/.test(normalizeText(data.paymentMethod)) && !data.creditDueDate) {
            meta.step = 'credit_due';
            await updateGuidedSaleState(pendingId, data, meta);
            await askGuidedSaleCreditDueDate(chatId);
            return true;
        }
        if (!data.paymentMethod) {
            meta.step = 'payment';
            await updateGuidedSaleState(pendingId, data, meta);
            await askGuidedSalePayment(chatId);
            return true;
        }
        if (!data.date) {
            meta.step = 'date';
            await updateGuidedSaleState(pendingId, data, meta);
            await askGuidedSaleDate(chatId);
            return true;
        }
        if (shouldCaptureGuidedDownPayment(data)) {
            meta.step = 'down_payment_confirm';
            await updateGuidedSaleState(pendingId, data, meta);
            await askGuidedSaleDownPayment(chatId);
            return true;
        }
        data.downPaymentAmount = 0;
        await sendGuidedSaleConfirmation(pendingId, chatId, data, meta);
        return true;
    }
    if (meta.skipAddMore) {
        clearGuidedVariantWizard(meta);
        return await advanceAfterItems(pendingId, chatId, data, meta);
    }
    meta.step = 'add_more';
    meta.currentProductId = undefined;
    meta.currentProductName = undefined;
    meta.candidateVariants = undefined;
    meta.candidateProducts = undefined;
    clearGuidedVariantWizard(meta);
    await updateGuidedSaleState(pendingId, data, meta);
    await askGuidedSaleAddMore(chatId);
    return true;
};
const buildCandidateVariantsFromItem = (item) => item.variants.map((variant) => ({
    id: variant.variantId,
    attribute: variant.attribute,
    value: variant.value,
}));
const startGuidedSale = async (chatId, companyId) => {
    const existing = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'sale_guided');
    if (existing && existing.status === 'PENDING_CONFIRMATION') {
        await dependencies_1.pendingEventRepository.updateStatus(existing.id, 'CANCELLED');
    }
    const inventoryMode = await dependencies_1.inventoryGateway.getInventoryMode(companyId);
    const expiresAt = new Date(Date.now() + PENDING_EXPIRATION_MINUTES * 60 * 1000);
    const created = await dependencies_1.pendingEventRepository.create({
        companyId,
        telegramUserId: chatId,
        eventType: 'sale_guided',
        interpretedData: {
            saleId: dependencies_1.inventoryGateway.idGenerator(),
            items: [],
        },
        metadata: { step: 'customer', inventoryMode },
        status: 'PENDING_CONFIRMATION',
        expiresAt,
    });
    await askGuidedSaleCustomer(chatId);
};
const getGuidedCustomerState = (pending) => {
    const rawData = pending.interpretedData ?? {};
    const rawMeta = pending.metadata ?? {};
    const name = typeof rawData.name === 'string' ? rawData.name : rawData.name === null ? null : undefined;
    const documentNumber = typeof rawData.documentNumber === 'string'
        ? rawData.documentNumber
        : rawData.documentNumber === null
            ? null
            : typeof rawData.cedula === 'string'
                ? rawData.cedula
                : rawData.cedula === null
                    ? null
                    : undefined;
    const phone = typeof rawData.phone === 'string' ? rawData.phone : rawData.phone === null ? null : undefined;
    const city = typeof rawData.city === 'string' ? rawData.city : rawData.city === null ? null : undefined;
    const address = typeof rawData.address === 'string' ? rawData.address : rawData.address === null ? null : undefined;
    return {
        data: { name, documentNumber, phone, city, address },
        meta: { step: rawMeta.step ?? 'name' },
    };
};
const updateGuidedCustomerState = async (pendingId, data, meta) => {
    await dependencies_1.pendingEventRepository.updateData(pendingId, data, meta);
};
const isValidCustomerPhone = (value) => {
    if (!value)
        return false;
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7;
};
const isValidCustomerDocument = (value) => {
    if (!value)
        return false;
    const normalized = normalizeCustomerDocumentInput(value);
    const alphanumericLength = normalized.replace(/[^a-zA-Z0-9]/g, '').length;
    return alphanumericLength >= 5;
};
const askGuidedCustomerName = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuál es el nombre del cliente?',
    });
};
const askGuidedCustomerDocument = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuál es la cédula/documento del cliente? (obligatorio)',
    });
};
const askGuidedCustomerPhone = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuál es el número de teléfono del cliente? (obligatorio)',
    });
};
const askGuidedCustomerCity = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuál es la ciudad del cliente? (opcional, escribe "sin" para omitir)',
    });
};
const askGuidedCustomerAddress = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuál es la dirección del cliente? (opcional, escribe "sin" para omitir)',
    });
};
const buildGuidedCustomerSummary = (data) => [
    'Resumen del cliente:',
    `Nombre: ${formatOptionalText(data.name ?? null)}`,
    `Cédula: ${formatOptionalText(data.documentNumber ?? null)}`,
    `Teléfono: ${formatOptionalText(data.phone ?? null)}`,
    `Ciudad: ${formatOptionalText(data.city ?? null)}`,
    `Dirección: ${formatOptionalText(data.address ?? null)}`,
    '',
    '¿Confirmas?',
].join('\n');
const createCustomerFromInput = async (chatId, companyId, data) => {
    const name = data.name?.trim();
    if (!name) {
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Debes indicar el nombre del cliente.' });
        return false;
    }
    const documentNumber = data.documentNumber?.trim() ?? null;
    if (!isValidCustomerDocument(documentNumber)) {
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: 'Debes indicar una cédula/documento válido (mínimo 5 caracteres).',
        });
        return false;
    }
    const phone = data.phone?.trim() ?? null;
    if (!isValidCustomerPhone(phone)) {
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: 'Debes indicar un número de teléfono válido (mínimo 7 dígitos).',
        });
        return false;
    }
    const normalizedName = (0, normalizeCustomerName_1.normalizeCustomerName)(name);
    const existing = await dependencies_1.arCustomerRepository.findByNormalizedName(companyId, normalizedName);
    if (existing) {
        const updated = await dependencies_1.arCustomerRepository.updateById(existing.id, {
            name,
            normalizedName,
            documentNumber,
            phone,
            city: data.city,
            address: data.address,
        });
        if (!updated) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'No pude actualizar el cliente existente.',
            });
            return false;
        }
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: `✅ Cliente actualizado: ${updated.name}\nCédula: ${updated.documentNumber ?? 'sin dato'}\nTeléfono: ${updated.phone ?? 'sin dato'}\nCiudad: ${updated.city ?? 'sin dato'}\nDirección: ${updated.address ?? 'sin dato'}`,
        });
        return true;
    }
    const customer = await dependencies_1.arCustomerRepository.create({
        companyId,
        name,
        normalizedName,
        documentNumber,
        phone,
        city: data.city ?? null,
        address: data.address ?? null,
    });
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: `✅ Cliente creado: ${customer.name}\nCédula: ${customer.documentNumber ?? 'sin dato'}\nTeléfono: ${customer.phone ?? 'sin dato'}\nCiudad: ${customer.city ?? 'sin dato'}\nDirección: ${customer.address ?? 'sin dato'}`,
    });
    return true;
};
const formatCustomerDetails = (customer) => [
    `Cliente: ${customer.name}`,
    `Cédula: ${formatOptionalText(customer.documentNumber ?? null)}`,
    `Teléfono: ${formatOptionalText(customer.phone ?? null)}`,
    `Ciudad: ${formatOptionalText(customer.city ?? null)}`,
    `Dirección: ${formatOptionalText(customer.address ?? null)}`,
].join('\n');
const sendCustomerLookup = async (chatId, companyId, rawName) => {
    const name = rawName.trim();
    if (!name) {
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Indica el nombre del cliente a consultar.' });
        return;
    }
    const normalized = (0, normalizeCustomerName_1.normalizeCustomerName)(name);
    const exact = await dependencies_1.arCustomerRepository.findByNormalizedName(companyId, normalized);
    if (exact) {
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: formatCustomerDetails(exact) });
        return;
    }
    const { items } = await dependencies_1.arCustomerRepository.listByCompany(companyId, { search: name, limit: 10 });
    if (items.length === 0) {
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No encontré clientes con "${name}".` });
        return;
    }
    if (items.length === 1) {
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: formatCustomerDetails(items[0]) });
        return;
    }
    const lines = items.map((item) => `- ${item.name}`);
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: `Encontré varios clientes. Especifica el nombre exacto:\n${lines.join('\n')}`,
    });
};
const startGuidedCustomer = async (chatId, companyId, prefill) => {
    const existing = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'customer_guided');
    if (existing && existing.status === 'PENDING_CONFIRMATION') {
        await dependencies_1.pendingEventRepository.updateStatus(existing.id, 'CANCELLED');
    }
    const data = {
        name: prefill?.name?.trim() ?? null,
        documentNumber: prefill?.documentNumber?.trim() ?? null,
        phone: prefill?.phone?.trim() ?? null,
        city: prefill?.city?.trim() ?? null,
        address: prefill?.address?.trim() ?? null,
    };
    let step = 'name';
    if (data.name)
        step = data.documentNumber ? 'phone' : 'documentNumber';
    if (data.name && data.documentNumber && data.phone)
        step = 'city';
    if (data.name && data.documentNumber && data.phone && (data.city || data.address))
        step = data.address ? 'confirm' : 'address';
    if (data.name && data.documentNumber && data.phone && !data.city && !data.address)
        step = 'city';
    const meta = { step };
    const expiresAt = new Date(Date.now() + PENDING_EXPIRATION_MINUTES * 60 * 1000);
    const created = await dependencies_1.pendingEventRepository.create({
        companyId,
        telegramUserId: chatId,
        eventType: 'customer_guided',
        interpretedData: data,
        metadata: meta,
        status: 'PENDING_CONFIRMATION',
        expiresAt,
    });
    if (meta.step === 'name') {
        await askGuidedCustomerName(chatId);
        return;
    }
    if (meta.step === 'documentNumber') {
        await askGuidedCustomerDocument(chatId);
        return;
    }
    if (meta.step === 'phone') {
        await askGuidedCustomerPhone(chatId);
        return;
    }
    if (meta.step === 'city') {
        await askGuidedCustomerCity(chatId);
        return;
    }
    if (meta.step === 'address') {
        await askGuidedCustomerAddress(chatId);
        return;
    }
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: buildGuidedCustomerSummary(data),
        replyMarkup: buildConfirmCancelKeyboard(),
    });
};
const handleGuidedCustomerMessage = async (pending, chatId, rawText) => {
    const text = rawText.trim();
    const normalized = normalizeText(text);
    if (/(^cancelar$)|(^cancel$)|(^salir$)|(^cancelar cliente$)/.test(normalized)) {
        await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CANCELLED');
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Operacion cancelada.' });
        return true;
    }
    const { data, meta } = getGuidedCustomerState(pending);
    if (meta.step === 'name') {
        if (!text) {
            await askGuidedCustomerName(chatId);
            return true;
        }
        data.name = text;
        meta.step = 'documentNumber';
        await updateGuidedCustomerState(pending.id, data, meta);
        await askGuidedCustomerDocument(chatId);
        return true;
    }
    if (meta.step === 'documentNumber') {
        const documentNumber = normalizeCustomerDocumentInput(text);
        if (!isValidCustomerDocument(documentNumber)) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'La cédula/documento no parece válida. Escribe al menos 5 caracteres.',
            });
            return true;
        }
        data.documentNumber = documentNumber;
        meta.step = 'phone';
        await updateGuidedCustomerState(pending.id, data, meta);
        await askGuidedCustomerPhone(chatId);
        return true;
    }
    if (meta.step === 'phone') {
        const phone = normalizePhoneInput(text);
        if (!isValidCustomerPhone(phone)) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'El teléfono no parece válido. Escribe el número completo (mínimo 7 dígitos).',
            });
            return true;
        }
        data.phone = phone;
        meta.step = 'city';
        await updateGuidedCustomerState(pending.id, data, meta);
        await askGuidedCustomerCity(chatId);
        return true;
    }
    if (meta.step === 'city') {
        data.city = normalizeOptionalField(text);
        meta.step = 'address';
        await updateGuidedCustomerState(pending.id, data, meta);
        await askGuidedCustomerAddress(chatId);
        return true;
    }
    if (meta.step === 'address') {
        data.address = normalizeOptionalField(text);
        meta.step = 'confirm';
        await updateGuidedCustomerState(pending.id, data, meta);
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: buildGuidedCustomerSummary(data),
            replyMarkup: buildConfirmCancelKeyboard(),
        });
        return true;
    }
    if (meta.step === 'confirm') {
        if (/^confirmar$|^confirmo$|^si$/.test(normalized)) {
            const created = await createCustomerFromInput(chatId, pending.companyId, data);
            if (created) {
                await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CONFIRMED');
            }
            return true;
        }
        if (/^cancelar$|^cancel$|^no$/.test(normalized)) {
            await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CANCELLED');
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Operacion cancelada.' });
            return true;
        }
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: 'Escribe "confirmar" para guardar el cliente (crear o actualizar) o "cancelar".',
            replyMarkup: buildConfirmCancelKeyboard(),
        });
        return true;
    }
    return false;
};
const handleGuidedCustomerCallback = async (pending, chatId, action) => {
    if (action === GUIDED_ACTIONS.cancel) {
        await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CANCELLED');
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Operacion cancelada.' });
        return true;
    }
    if (action === GUIDED_ACTIONS.confirm) {
        const { data } = getGuidedCustomerState(pending);
        const created = await createCustomerFromInput(chatId, pending.companyId, data);
        if (created) {
            await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CONFIRMED');
        }
        return true;
    }
    return false;
};
const getGuidedInvoiceIssuerState = (pending) => {
    const rawData = pending.interpretedData ?? {};
    const rawMeta = pending.metadata ?? {};
    const companyName = typeof rawData.companyName === 'string' ? rawData.companyName : rawData.companyName === null ? null : undefined;
    const taxId = typeof rawData.taxId === 'string'
        ? rawData.taxId
        : rawData.taxId === null
            ? null
            : typeof rawData.nit === 'string'
                ? rawData.nit
                : rawData.nit === null
                    ? null
                    : undefined;
    const contactPhone = typeof rawData.contactPhone === 'string' ? rawData.contactPhone : rawData.contactPhone === null ? null : undefined;
    const address = typeof rawData.address === 'string' ? rawData.address : rawData.address === null ? null : undefined;
    return {
        data: { companyName, taxId, contactPhone, address },
        meta: { step: rawMeta.step ?? 'companyName' },
    };
};
const updateGuidedInvoiceIssuerState = async (pendingId, data, meta) => {
    await dependencies_1.pendingEventRepository.updateData(pendingId, data, meta);
};
const isValidInvoiceIssuerCompanyName = (value) => {
    if (!value)
        return false;
    return value.trim().length >= 2;
};
const isValidInvoiceIssuerTaxId = (value) => {
    if (!value)
        return false;
    const normalized = normalizeCustomerDocumentInput(value);
    const alphanumericLength = normalized.replace(/[^a-zA-Z0-9]/g, '').length;
    return alphanumericLength >= 5;
};
const askGuidedInvoiceIssuerCompanyName = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuál es el nombre de la empresa para la factura? (obligatorio)',
    });
};
const askGuidedInvoiceIssuerTaxId = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuál es el NIT o cédula de la empresa? (obligatorio)',
    });
};
const askGuidedInvoiceIssuerContactPhone = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuál es el teléfono de contacto de la empresa? (obligatorio)',
    });
};
const askGuidedInvoiceIssuerAddress = async (chatId) => {
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: '¿Cuál es la dirección de la empresa? (obligatorio)',
    });
};
const buildGuidedInvoiceIssuerSummary = (data) => [
    'Resumen de datos de la empresa:',
    `Nombre: ${formatOptionalText(data.companyName ?? null)}`,
    `NIT/Cédula: ${formatOptionalText(data.taxId ?? null)}`,
    `Contacto: ${formatOptionalText(data.contactPhone ?? null)}`,
    `Dirección: ${formatOptionalText(data.address ?? null)}`,
    '',
    '¿Confirmas guardar estos datos para la factura?',
].join('\n');
const saveInvoiceIssuerSettingsFromInput = async (chatId, companyId, data) => {
    const companyName = data.companyName?.trim() ?? null;
    if (!isValidInvoiceIssuerCompanyName(companyName)) {
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: 'Debes indicar un nombre de empresa válido.',
        });
        return false;
    }
    const taxId = data.taxId?.trim() ?? null;
    if (!isValidInvoiceIssuerTaxId(taxId)) {
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: 'Debes indicar un NIT/cédula válido (mínimo 5 caracteres).',
        });
        return false;
    }
    const contactPhone = data.contactPhone?.trim() ?? null;
    if (!isValidCustomerPhone(contactPhone)) {
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: 'Debes indicar un teléfono de contacto válido (mínimo 7 dígitos).',
        });
        return false;
    }
    const address = data.address?.trim() ?? null;
    if (!address) {
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: 'Debes indicar la dirección de la empresa.',
        });
        return false;
    }
    const saved = await dependencies_1.invoiceIssuerSettingsRepository.save({
        companyId,
        companyName,
        taxId,
        contactPhone,
        address,
    });
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: `✅ Datos de empresa guardados para facturas.\nNombre: ${saved.companyName ?? 'sin dato'}\nNIT/Cédula: ${saved.taxId ?? 'sin dato'}\nContacto: ${saved.contactPhone ?? 'sin dato'}\nDirección: ${saved.address ?? 'sin dato'}`,
    });
    return true;
};
const startGuidedInvoiceIssuer = async (chatId, companyId) => {
    const existing = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'invoice_issuer_guided');
    if (existing && existing.status === 'PENDING_CONFIRMATION') {
        await dependencies_1.pendingEventRepository.updateStatus(existing.id, 'CANCELLED');
    }
    const current = await dependencies_1.invoiceIssuerSettingsRepository.getByCompanyId(companyId);
    const data = {
        companyName: current?.companyName ?? null,
        taxId: current?.taxId ?? null,
        contactPhone: current?.contactPhone ?? null,
        address: current?.address ?? null,
    };
    const meta = { step: 'companyName' };
    const expiresAt = new Date(Date.now() + PENDING_EXPIRATION_MINUTES * 60 * 1000);
    await dependencies_1.pendingEventRepository.create({
        companyId,
        telegramUserId: chatId,
        eventType: 'invoice_issuer_guided',
        interpretedData: data,
        metadata: meta,
        status: 'PENDING_CONFIRMATION',
        expiresAt,
    });
    const hasCurrentData = Boolean(current?.companyName || current?.taxId || current?.contactPhone || current?.address);
    if (hasCurrentData) {
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: `Datos actuales de factura:\nNombre: ${formatOptionalText(data.companyName ?? null)}\nNIT/Cédula: ${formatOptionalText(data.taxId ?? null)}\nContacto: ${formatOptionalText(data.contactPhone ?? null)}\nDirección: ${formatOptionalText(data.address ?? null)}\n\nVamos a actualizarlos. Escribe el nuevo nombre de la empresa:`,
        });
        return;
    }
    await askGuidedInvoiceIssuerCompanyName(chatId);
};
const handleGuidedInvoiceIssuerMessage = async (pending, chatId, rawText) => {
    const text = rawText.trim();
    const normalized = normalizeText(text);
    if (/(^cancelar$)|(^cancel$)|(^salir$)|(^cancelar empresa$)|(^cancelar datos empresa$)/.test(normalized)) {
        await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CANCELLED');
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Operacion cancelada.' });
        return true;
    }
    const { data, meta } = getGuidedInvoiceIssuerState(pending);
    if (meta.step === 'companyName') {
        if (!isValidInvoiceIssuerCompanyName(text)) {
            await askGuidedInvoiceIssuerCompanyName(chatId);
            return true;
        }
        data.companyName = text;
        meta.step = 'taxId';
        await updateGuidedInvoiceIssuerState(pending.id, data, meta);
        await askGuidedInvoiceIssuerTaxId(chatId);
        return true;
    }
    if (meta.step === 'taxId') {
        const taxId = normalizeCustomerDocumentInput(text);
        if (!isValidInvoiceIssuerTaxId(taxId)) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'El NIT/cédula no parece válido. Escribe al menos 5 caracteres.',
            });
            return true;
        }
        data.taxId = taxId;
        meta.step = 'contactPhone';
        await updateGuidedInvoiceIssuerState(pending.id, data, meta);
        await askGuidedInvoiceIssuerContactPhone(chatId);
        return true;
    }
    if (meta.step === 'contactPhone') {
        const contactPhone = normalizePhoneInput(text);
        if (!isValidCustomerPhone(contactPhone)) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'El teléfono no parece válido. Escribe el número completo (mínimo 7 dígitos).',
            });
            return true;
        }
        data.contactPhone = contactPhone;
        meta.step = 'address';
        await updateGuidedInvoiceIssuerState(pending.id, data, meta);
        await askGuidedInvoiceIssuerAddress(chatId);
        return true;
    }
    if (meta.step === 'address') {
        if (!text) {
            await askGuidedInvoiceIssuerAddress(chatId);
            return true;
        }
        data.address = text;
        meta.step = 'confirm';
        await updateGuidedInvoiceIssuerState(pending.id, data, meta);
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: buildGuidedInvoiceIssuerSummary(data),
            replyMarkup: buildConfirmCancelKeyboard(),
        });
        return true;
    }
    if (meta.step === 'confirm') {
        if (/^confirmar$|^confirmo$|^si$/.test(normalized)) {
            const saved = await saveInvoiceIssuerSettingsFromInput(chatId, pending.companyId, data);
            if (saved) {
                await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CONFIRMED');
            }
            return true;
        }
        if (/^cancelar$|^cancel$|^no$/.test(normalized)) {
            await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CANCELLED');
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Operacion cancelada.' });
            return true;
        }
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: 'Escribe "confirmar" para guardar los datos de empresa o "cancelar".',
            replyMarkup: buildConfirmCancelKeyboard(),
        });
        return true;
    }
    return false;
};
const handleGuidedInvoiceIssuerCallback = async (pending, chatId, action) => {
    if (action === GUIDED_ACTIONS.cancel) {
        await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CANCELLED');
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Operacion cancelada.' });
        return true;
    }
    if (action === GUIDED_ACTIONS.confirm) {
        const { data } = getGuidedInvoiceIssuerState(pending);
        const saved = await saveInvoiceIssuerSettingsFromInput(chatId, pending.companyId, data);
        if (saved) {
            await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CONFIRMED');
        }
        return true;
    }
    return false;
};
const startGuidedSaleWithPrefill = async (chatId, saleInput, productNameGuess) => {
    const existing = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'sale_guided');
    if (existing && existing.status === 'PENDING_CONFIRMATION') {
        await dependencies_1.pendingEventRepository.updateStatus(existing.id, 'CANCELLED');
    }
    const expiresAt = new Date(Date.now() + PENDING_EXPIRATION_MINUTES * 60 * 1000);
    const priceAmount = saleInput.unitPrice ?? saleInput.totalAmount ?? null;
    const priceScope = saleInput.unitPrice ? 'unit' : saleInput.totalAmount ? 'total' : null;
    const inventoryMode = await dependencies_1.inventoryGateway.getInventoryMode(saleInput.companyId);
    let step = 'product';
    const meta = { step, inventoryMode };
    let prefillProduct = null;
    let candidateVariants = null;
    if (productNameGuess?.trim()) {
        const product = await resolveProductByName(saleInput.companyId, productNameGuess);
        if (product) {
            if (inventoryMode === 'SIMPLE') {
                prefillProduct = { id: product.id.toString(), name: product.name };
                step = 'quantity';
            }
            else {
                const variants = await dependencies_1.inventoryGateway.listVariantsByProductId(saleInput.companyId, String(product.id));
                const activeVariants = variants.filter((variant) => variant.active);
                if (activeVariants.length > 0) {
                    prefillProduct = { id: product.id.toString(), name: product.name };
                    candidateVariants = activeVariants.map((variant) => ({
                        id: variant.id.toString(),
                        attribute: variant.attribute,
                        value: variant.value,
                    }));
                    step = 'variants';
                }
            }
        }
    }
    meta.step = step;
    if (prefillProduct) {
        meta.currentProductId = prefillProduct.id;
        meta.currentProductName = prefillProduct.name;
    }
    if (candidateVariants) {
        meta.candidateVariants = candidateVariants;
        if (meta.step === 'variants') {
            resetGuidedVariantWizard(meta, candidateVariants.length);
        }
    }
    if (saleInput.quantity && saleInput.quantity > 0) {
        meta.pendingTotalQty = saleInput.quantity;
    }
    if (priceAmount && priceAmount > 0 && priceScope) {
        meta.pendingPriceAmount = priceAmount;
        meta.pendingPriceScope = priceScope;
        meta.autoPriceApply = true;
    }
    await dependencies_1.pendingEventRepository.create({
        companyId: saleInput.companyId,
        telegramUserId: chatId,
        eventType: 'sale_guided',
        interpretedData: {
            saleId: dependencies_1.inventoryGateway.idGenerator(),
            customerName: saleInput.customerName ?? null,
            paymentMethod: saleInput.paymentMethod ?? null,
            date: saleInput.date ?? null,
            unitPrice: saleInput.unitPrice ?? null,
            totalAmount: saleInput.totalAmount ?? null,
            items: [],
        },
        metadata: meta,
        status: 'PENDING_CONFIRMATION',
        expiresAt,
    });
    if (meta.step === 'variants' && meta.currentProductName && meta.candidateVariants) {
        await askGuidedSaleVariants(chatId, meta.currentProductName, meta.candidateVariants, meta.pendingTotalQty ?? null);
        return;
    }
    if (meta.step === 'quantity' && meta.currentProductName) {
        await askGuidedSaleQuantity(chatId, meta.currentProductName, meta.pendingTotalQty ?? null);
        return;
    }
    await askGuidedSaleProduct(chatId);
};
const sendProductListMessage = async (chatId, companyId) => {
    const { items } = await dependencies_1.inventoryGateway.listProducts({
        companyId,
        q: undefined,
        active: true,
        page: 1,
        pageSize: 30,
    });
    if (items.length === 0) {
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No tienes productos activos.' });
        return;
    }
    const lines = items.map((item) => `- ${item.name}`);
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: `Productos disponibles:\n${lines.join('\n')}`,
    });
};
const resolveProductByName = async (companyId, name) => {
    const normalizeToken = (value) => {
        let token = normalizeText(value);
        token = token.replace(/[^a-z0-9]/g, '');
        if (token.endsWith('es') && token.length > 3)
            token = token.slice(0, -2);
        if (token.endsWith('s') && token.length > 3)
            token = token.slice(0, -1);
        return token;
    };
    const buildTokens = (value) => {
        const stop = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'por', 'un', 'una', 'unos', 'unas', 'y']);
        return normalizeText(value)
            .split(/[\s,.;:!?]+/)
            .map((token) => normalizeToken(token))
            .filter((token) => token && !stop.has(token));
    };
    const { items } = await dependencies_1.inventoryGateway.listProducts({
        companyId,
        q: name,
        active: true,
        page: 1,
        pageSize: 10,
    });
    if (items.length === 0) {
        const normalized = normalizeText(name);
        const inputTokens = buildTokens(name);
        const allItems = [];
        const maxPages = 6;
        for (let page = 1; page <= maxPages; page += 1) {
            const fallback = await dependencies_1.inventoryGateway.listProducts({
                companyId,
                q: undefined,
                active: true,
                page,
                pageSize: 200,
            });
            if (fallback.items.length === 0)
                break;
            allItems.push(...fallback.items);
            if (fallback.items.length < 200)
                break;
        }
        const filtered = allItems.filter((item) => {
            const nameNorm = normalizeText(item.name);
            const skuNorm = normalizeText(item.sku.toString());
            if (nameNorm.includes(normalized) || skuNorm.includes(normalized))
                return true;
            const nameTokens = buildTokens(item.name);
            return inputTokens.length > 0 && inputTokens.every((token) => nameTokens.includes(token));
        });
        if (filtered.length === 0) {
            if (inputTokens.length === 0)
                return null;
            const scored = allItems
                .map((item) => {
                const nameTokens = buildTokens(item.name);
                const score = inputTokens.reduce((sum, token) => (nameTokens.includes(token) ? sum + 1 : sum), 0);
                return { item, score };
            })
                .filter((entry) => entry.score > 0)
                .sort((a, b) => b.score - a.score);
            if (scored.length > 0)
                return scored[0].item;
            return null;
        }
        if (filtered.length === 1)
            return filtered[0];
        const exact = filtered.find((item) => normalizeText(item.name) === normalized || normalizeText(item.sku.toString()) === normalized);
        return exact ?? null;
    }
    const normalized = normalizeText(name);
    const exact = items.find((item) => normalizeText(item.name) === normalized);
    if (exact)
        return exact;
    if (items.length === 1)
        return items[0];
    const inputTokens = buildTokens(name);
    if (inputTokens.length > 0 && items.length > 0) {
        const scored = items
            .map((item) => {
            const nameTokens = buildTokens(item.name);
            const score = inputTokens.reduce((sum, token) => (nameTokens.includes(token) ? sum + 1 : sum), 0);
            return { item, score };
        })
            .filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score);
        if (scored.length === 1)
            return scored[0].item;
        if (scored.length > 1 && scored[0].score > scored[1].score)
            return scored[0].item;
    }
    return null;
};
const resolveVariantByValue = async (companyId, productId, attribute, value) => {
    const variants = await dependencies_1.inventoryGateway.listVariantsByProductId(companyId, String(productId));
    const activeVariants = variants.filter((variant) => variant.active);
    const normalizedValue = normalizeText(value);
    if (attribute) {
        const normalizedAttribute = normalizeText(attribute);
        const exact = activeVariants.find((variant) => normalizeText(variant.attribute) === normalizedAttribute && normalizeText(variant.value) === normalizedValue);
        if (exact)
            return exact;
    }
    return activeVariants.find((variant) => normalizeText(variant.value) === normalizedValue) ?? null;
};
const startFastSaleFromText = async (chatId, companyId, rawText, options) => {
    const existing = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'sale_guided');
    if (existing && existing.status === 'PENDING_CONFIRMATION') {
        await dependencies_1.pendingEventRepository.updateStatus(existing.id, 'CANCELLED');
    }
    const inventoryMode = await dependencies_1.inventoryGateway.getInventoryMode(companyId);
    const cleanedText = rawText.replace(/venta\s+rápida|venta\s+rapida|registrar\s+venta\s+rápida|registrar\s+venta\s+rapida/gi, '').trim();
    const parsed = await (0, aiSaleItemsParser_1.aiParseSaleItems)(cleanedText || rawText);
    if (!parsed || parsed.items.length === 0) {
        if (!options?.silentFail) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'No pude entender los productos. Intenta con: "Pantalón: 28=10, 30=20 a 70000 c/u".',
            });
        }
        return false;
    }
    const sourceText = cleanedText || rawText;
    const explicitSaleQty = parseExplicitSaleQty(sourceText);
    const hasPackHint = hasPackHintInSaleText(sourceText);
    const data = {
        saleId: dependencies_1.inventoryGateway.idGenerator(),
        customerName: parsed.customerName,
        paymentMethod: parsed.paymentMethod,
        creditDueDate: parsed.creditDueDate,
        date: parsed.date,
        unitPrice: null,
        totalAmount: null,
        items: [],
    };
    for (const item of parsed.items) {
        const product = await resolveProductByName(companyId, item.productName);
        if (!product) {
            if (!options?.silentFail) {
                await telegramClient_1.TelegramClient.sendMessage({
                    chatId,
                    text: `No pude identificar el producto "${item.productName}". Usa el nombre exacto o escribe "venta guiada".`,
                });
            }
            return false;
        }
        if (inventoryMode === 'SIMPLE') {
            let totalQty = 0;
            let unitPrice = null;
            let totalPrice = null;
            for (const variant of item.variants) {
                const qty = Number(variant.qty);
                if (Number.isFinite(qty) && qty > 0) {
                    totalQty += Math.round(qty);
                }
                if (!unitPrice && variant.unitPrice && variant.unitPrice > 0) {
                    unitPrice = Math.round(variant.unitPrice);
                }
                if (!totalPrice && variant.totalPrice && variant.totalPrice > 0) {
                    totalPrice = Math.round(variant.totalPrice);
                }
            }
            if (parsed.items.length === 1 && explicitSaleQty && hasPackHint) {
                totalQty = explicitSaleQty;
            }
            else if (parsed.items.length === 1 && explicitSaleQty && totalQty <= 0) {
                totalQty = explicitSaleQty;
            }
            if (!Number.isFinite(totalQty) || totalQty <= 0) {
                if (!options?.silentFail) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `Cantidad invalida para ${product.name}.`,
                    });
                }
                return false;
            }
            const resolvedUnitPrice = unitPrice ?? (totalPrice && totalPrice > 0 ? Math.round(totalPrice / totalQty) : null);
            data.items.push({
                productId: product.id.toString(),
                productName: product.name,
                variants: [buildSimpleGuidedVariant(totalQty, resolvedUnitPrice)],
            });
            continue;
        }
        const variants = [];
        let needsVariantSelection = false;
        let pendingPriceAmount = null;
        let pendingPriceScope = null;
        let pendingTotalQty = 0;
        for (const variant of item.variants) {
            if (variant.value === '__unspecified__') {
                needsVariantSelection = true;
                const qty = Number(variant.qty);
                if (Number.isFinite(qty) && qty > 0)
                    pendingTotalQty += qty;
                if (variant.unitPrice && variant.unitPrice > 0) {
                    pendingPriceAmount = variant.unitPrice;
                    pendingPriceScope = 'unit';
                }
                else if (variant.totalPrice && variant.totalPrice > 0) {
                    pendingPriceAmount = variant.totalPrice;
                    pendingPriceScope = 'total';
                }
                continue;
            }
            const resolved = await resolveVariantByValue(companyId, product.id, variant.attribute ?? null, variant.value);
            if (!resolved) {
                const qty = Number(variant.qty);
                if (Number.isFinite(qty) && qty > 0)
                    pendingTotalQty += qty;
                if (variant.unitPrice && variant.unitPrice > 0 && !pendingPriceAmount) {
                    pendingPriceAmount = variant.unitPrice;
                    pendingPriceScope = 'unit';
                }
                else if (variant.totalPrice && variant.totalPrice > 0 && !pendingPriceAmount) {
                    pendingPriceAmount = variant.totalPrice;
                    pendingPriceScope = 'total';
                }
                if (options?.allowGuidedFallback) {
                    needsVariantSelection = true;
                    continue;
                }
                if (!options?.silentFail) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `No encontre la variante "${variant.value}" para ${product.name}. Usa "venta guiada" o el valor exacto.`,
                    });
                }
                return false;
            }
            const qty = Number(variant.qty);
            if (!Number.isFinite(qty) || qty <= 0) {
                if (!options?.silentFail) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `Cantidad invalida para ${product.name} ${variant.value}.`,
                    });
                }
                return false;
            }
            let unitPrice = null;
            if (variant.unitPrice && variant.unitPrice > 0) {
                unitPrice = variant.unitPrice;
            }
            else if (variant.totalPrice && variant.totalPrice > 0) {
                unitPrice = Math.round(variant.totalPrice / qty);
            }
            variants.push({
                variantId: resolved.id.toString(),
                attribute: resolved.attribute,
                value: resolved.value,
                qty,
                unitPrice,
            });
        }
        if (needsVariantSelection && options?.allowGuidedFallback) {
            const allVariants = await dependencies_1.inventoryGateway.listVariantsByProductId(companyId, String(product.id));
            const activeVariants = allVariants.filter((variant) => variant.active);
            if (activeVariants.length === 0) {
                if (!options?.silentFail) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: 'Ese producto no tiene variantes activas. Crea variantes e intenta de nuevo.',
                    });
                }
                return false;
            }
            const expiresAt = new Date(Date.now() + PENDING_EXPIRATION_MINUTES * 60 * 1000);
            const effectivePendingTotalQty = parsed.items.length === 1 && explicitSaleQty && hasPackHint
                ? explicitSaleQty
                : pendingTotalQty > 0
                    ? pendingTotalQty
                    : parsed.items.length === 1 && explicitSaleQty
                        ? explicitSaleQty
                        : null;
            const meta = {
                step: 'variants',
                inventoryMode,
                currentProductId: product.id.toString(),
                currentProductName: product.name,
                candidateVariants: activeVariants.map((variant) => ({
                    id: variant.id.toString(),
                    attribute: variant.attribute,
                    value: variant.value,
                })),
                variantWizardIndex: 0,
                variantWizardValues: activeVariants.map(() => 0),
                pendingTotalQty: effectivePendingTotalQty,
                pendingPriceAmount,
                pendingPriceScope,
                autoPriceApply: pendingPriceAmount ? true : undefined,
            };
            const created = await dependencies_1.pendingEventRepository.create({
                companyId,
                telegramUserId: chatId,
                eventType: 'sale_guided',
                interpretedData: data,
                metadata: meta,
                status: 'PENDING_CONFIRMATION',
                expiresAt,
            });
            if (!meta.candidateVariants || meta.candidateVariants.length === 0) {
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude cargar las variantes para este producto.' });
                return true;
            }
            const autoQty = meta.pendingTotalQty && meta.pendingTotalQty > 0 ? Math.round(meta.pendingTotalQty) : 0;
            if (meta.candidateVariants.length === 1 && autoQty > 0) {
                const only = meta.candidateVariants[0];
                const variantLabel = `${only.attribute} ${only.value}`.trim();
                await telegramClient_1.TelegramClient.sendMessage({
                    chatId,
                    text: `Detecte una sola variante (${variantLabel}) y asigne automaticamente la cantidad ${autoQty}.`,
                });
                return await applyGuidedVariantSelection(created.id, chatId, data, meta, [
                    {
                        variantId: only.id,
                        attribute: only.attribute,
                        value: only.value,
                        qty: autoQty,
                        unitPrice: null,
                    },
                ]);
            }
            await askGuidedSaleVariants(chatId, product.name, meta.candidateVariants, meta.pendingTotalQty ?? null);
            return true;
        }
        if (variants.length > 0) {
            data.items.push({
                productId: product.id.toString(),
                productName: product.name,
                variants,
            });
        }
    }
    if (data.items.length === 0) {
        return false;
    }
    const pendingPriceProductIds = data.items.filter((item) => item.variants.some((variant) => !variant.unitPrice || variant.unitPrice <= 0)).map((item) => item.productId);
    const forceAddMorePrompt = inventoryMode === 'SIMPLE';
    const meta = {
        step: 'confirm',
        inventoryMode,
        fastMode: forceAddMorePrompt ? undefined : true,
        pendingPriceProductIds,
    };
    if (pendingPriceProductIds.length > 0) {
        const currentId = pendingPriceProductIds[0];
        const current = data.items.find((item) => item.productId === currentId);
        if (current) {
            meta.currentProductId = current.productId;
            meta.currentProductName = current.productName;
            meta.candidateVariants = buildCandidateVariantsFromItem(current);
            meta.step = isSimpleGuidedSale(meta) ? 'price_same' : 'price_mode';
        }
    }
    else if (forceAddMorePrompt) {
        meta.step = 'add_more';
    }
    else if (data.paymentMethod && /credito|cr[eé]dito/.test(normalizeText(data.paymentMethod)) && !data.creditDueDate) {
        meta.step = 'credit_due';
    }
    else if (!data.paymentMethod) {
        meta.step = 'payment';
    }
    else if (!data.date) {
        meta.step = 'date';
    }
    const expiresAt = new Date(Date.now() + PENDING_EXPIRATION_MINUTES * 60 * 1000);
    const created = await dependencies_1.pendingEventRepository.create({
        companyId,
        telegramUserId: chatId,
        eventType: 'sale_guided',
        interpretedData: data,
        metadata: meta,
        status: 'PENDING_CONFIRMATION',
        expiresAt,
    });
    if (meta.step === 'confirm') {
        if (shouldCaptureGuidedDownPayment(data)) {
            meta.step = 'down_payment_confirm';
            await updateGuidedSaleState(created.id, data, meta);
            await askGuidedSaleDownPayment(chatId);
            return true;
        }
        data.downPaymentAmount = 0;
        await sendGuidedSaleConfirmation(created.id, chatId, data, meta);
        return true;
    }
    if (meta.step === 'price_mode') {
        await askGuidedSalePrice(chatId);
        return true;
    }
    if (meta.step === 'price_same') {
        await askGuidedSalePriceValue(chatId);
        return true;
    }
    if (meta.step === 'add_more') {
        await askGuidedSaleAddMore(chatId);
        return true;
    }
    if (meta.step === 'payment') {
        await askGuidedSalePayment(chatId);
        return true;
    }
    if (meta.step === 'credit_due') {
        await askGuidedSaleCreditDueDate(chatId);
        return true;
    }
    if (meta.step === 'date') {
        await askGuidedSaleDate(chatId);
        return true;
    }
    return true;
};
const ensurePendingState = async (pending) => {
    if (!pending)
        return null;
    const now = new Date();
    if (pending.expiresAt && pending.expiresAt < now) {
        const expired = await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'EXPIRED');
        if (!expired)
            return null;
        return { pending: expired, status: 'EXPIRED' };
    }
    return { pending, status: pending.status };
};
const handleGuidedSaleMessage = async (pending, chatId, rawText) => {
    const text = rawText.trim();
    const normalized = normalizeText(text);
    if (/(^cancelar$)|(^cancel$)|(^salir$)|(^cancelar venta$)/.test(normalized)) {
        await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CANCELLED');
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Operacion cancelada.' });
        return true;
    }
    const { data, meta } = getGuidedSaleState(pending);
    if (!meta.inventoryMode) {
        meta.inventoryMode = await dependencies_1.inventoryGateway.getInventoryMode(pending.companyId);
    }
    if (data.items.length === 0 &&
        (meta.step === 'price_mode' ||
            meta.step === 'price_same' ||
            meta.step === 'price_same_type' ||
            meta.step === 'price_variants' ||
            meta.step === 'payment' ||
            meta.step === 'credit_due' ||
            meta.step === 'date' ||
            meta.step === 'confirm')) {
        meta.step = 'product';
        await updateGuidedSaleState(pending.id, data, meta);
        await askGuidedSaleProduct(chatId);
        return true;
    }
    if ((meta.step === 'payment' || meta.step === 'credit_due' || meta.step === 'date' || meta.step === 'confirm') && !allVariantsPriced(data)) {
        if (meta.step === 'payment') {
            data.paymentMethod = text;
        }
        else if (meta.step === 'credit_due') {
            const parsedDue = parseCreditDueInput(text, data.date ?? null);
            if (parsedDue?.dueDate) {
                data.creditDueDate = parsedDue.dueDate;
                meta.pendingCreditTermAmount = null;
                meta.pendingCreditTermUnit = null;
            }
            else if (parsedDue?.termAmount && parsedDue.termUnit) {
                data.creditDueDate = null;
                meta.pendingCreditTermAmount = parsedDue.termAmount;
                meta.pendingCreditTermUnit = parsedDue.termUnit;
            }
        }
        else if (meta.step === 'date') {
            const date = parseDateInput(text);
            if (date) {
                data.date = date;
                if (meta.pendingCreditTermAmount && meta.pendingCreditTermUnit) {
                    const dueDate = addCreditTermToDate(date, meta.pendingCreditTermAmount, meta.pendingCreditTermUnit);
                    if (dueDate)
                        data.creditDueDate = dueDate;
                    meta.pendingCreditTermAmount = null;
                    meta.pendingCreditTermUnit = null;
                }
            }
        }
        const nextItem = data.items.find((item) => item.variants.some((variant) => !variant.unitPrice || variant.unitPrice <= 0));
        if (nextItem) {
            meta.currentProductId = nextItem.productId;
            meta.currentProductName = nextItem.productName;
            meta.candidateVariants = buildCandidateVariantsFromItem(nextItem);
            meta.step = isSimpleGuidedSale(meta) ? 'price_same' : 'price_mode';
            await updateGuidedSaleState(pending.id, data, meta);
            if (isSimpleGuidedSale(meta)) {
                await askGuidedSalePriceValue(chatId);
            }
            else {
                await askGuidedSalePrice(chatId);
            }
            return true;
        }
    }
    if (meta.step === 'customer') {
        const customerName = normalized.includes('sin cliente') ? null : text;
        data.customerName = customerName;
        meta.step = 'product';
        await updateGuidedSaleState(pending.id, data, meta);
        await askGuidedSaleProduct(chatId);
        return true;
    }
    if (meta.step === 'product_select' && meta.candidateProducts?.length) {
        const index = Number(text);
        const selected = Number.isFinite(index) ? meta.candidateProducts[index - 1] : null;
        if (!selected) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Selecciona un numero valido de la lista.' });
            return true;
        }
        meta.currentProductId = selected.id;
        meta.currentProductName = selected.name;
        if (isSimpleGuidedSale(meta)) {
            await moveGuidedSaleToQuantityStep(pending.id, chatId, data, meta, selected.id, selected.name);
            return true;
        }
        const variants = await dependencies_1.inventoryGateway.listVariantsByProductId(pending.companyId, selected.id);
        const activeVariants = variants.filter((variant) => variant.active);
        if (activeVariants.length === 0) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Ese producto no tiene variantes activas. Crea variantes e intenta de nuevo.' });
            meta.step = 'product';
            meta.currentProductId = undefined;
            meta.currentProductName = undefined;
            meta.candidateVariants = undefined;
            clearGuidedVariantWizard(meta);
            await updateGuidedSaleState(pending.id, data, meta);
            return true;
        }
        meta.step = 'variants';
        meta.candidateVariants = activeVariants.map((variant) => ({
            id: variant.id.toString(),
            attribute: variant.attribute,
            value: variant.value,
        }));
        resetGuidedVariantWizard(meta, meta.candidateVariants.length);
        await updateGuidedSaleState(pending.id, data, meta);
        await askGuidedSaleVariants(chatId, selected.name, meta.candidateVariants, meta.pendingTotalQty ?? null);
        return true;
    }
    if (meta.step === 'product') {
        const { items } = await dependencies_1.inventoryGateway.listProducts({
            companyId: pending.companyId,
            q: text,
            active: true,
            page: 1,
            pageSize: 10,
        });
        let candidates = items;
        if (candidates.length === 0) {
            const fallback = await dependencies_1.inventoryGateway.listProducts({
                companyId: pending.companyId,
                q: undefined,
                active: true,
                page: 1,
                pageSize: 200,
            });
            const normalized = normalizeText(text);
            candidates = fallback.items.filter((item) => {
                const nameNorm = normalizeText(item.name);
                const skuNorm = normalizeText(item.sku.toString());
                return nameNorm.includes(normalized) || skuNorm.includes(normalized);
            });
        }
        if (candidates.length === 0) {
            const fallback = await dependencies_1.inventoryGateway.listProducts({
                companyId: pending.companyId,
                q: undefined,
                active: true,
                page: 1,
                pageSize: 50,
            });
            const skuInput = normalizeText(text);
            const skuMatch = fallback.items.find((item) => normalizeText(item.sku.toString()) === skuInput);
            if (skuMatch) {
                meta.currentProductId = skuMatch.id.toString();
                meta.currentProductName = skuMatch.name;
                if (isSimpleGuidedSale(meta)) {
                    await moveGuidedSaleToQuantityStep(pending.id, chatId, data, meta, skuMatch.id.toString(), skuMatch.name);
                    return true;
                }
                const variants = await dependencies_1.inventoryGateway.listVariantsByProductId(pending.companyId, skuMatch.id);
                const activeVariants = variants.filter((variant) => variant.active);
                if (activeVariants.length === 0) {
                    await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Ese producto no tiene variantes activas. Crea variantes e intenta de nuevo.' });
                    return true;
                }
                meta.step = 'variants';
                meta.candidateVariants = activeVariants.map((variant) => ({
                    id: variant.id.toString(),
                    attribute: variant.attribute,
                    value: variant.value,
                }));
                resetGuidedVariantWizard(meta, meta.candidateVariants.length);
                await updateGuidedSaleState(pending.id, data, meta);
                await askGuidedSaleVariants(chatId, skuMatch.name, meta.candidateVariants, meta.pendingTotalQty ?? null);
                return true;
            }
            if (fallback.items.length === 0) {
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No tienes productos activos.' });
                return true;
            }
            meta.step = 'product_select';
            meta.candidateProducts = fallback.items.map((product) => ({ id: product.id.toString(), name: product.name }));
            await updateGuidedSaleState(pending.id, data, meta);
            const list = meta.candidateProducts.map((product, index) => `${index + 1}) ${product.name}`).join('\n');
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `No encontre ese producto. Elige de la lista:\n${list}\nResponde con el numero.`,
            });
            return true;
        }
        if (candidates.length === 1) {
            const product = candidates[0];
            meta.currentProductId = product.id.toString();
            meta.currentProductName = product.name;
            if (isSimpleGuidedSale(meta)) {
                await moveGuidedSaleToQuantityStep(pending.id, chatId, data, meta, product.id.toString(), product.name);
                return true;
            }
            const variants = await dependencies_1.inventoryGateway.listVariantsByProductId(pending.companyId, String(product.id));
            const activeVariants = variants.filter((variant) => variant.active);
            if (activeVariants.length === 0) {
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Ese producto no tiene variantes activas. Crea variantes e intenta de nuevo.' });
                return true;
            }
            meta.step = 'variants';
            meta.candidateVariants = activeVariants.map((variant) => ({
                id: variant.id.toString(),
                attribute: variant.attribute,
                value: variant.value,
            }));
            resetGuidedVariantWizard(meta, meta.candidateVariants.length);
            await updateGuidedSaleState(pending.id, data, meta);
            await askGuidedSaleVariants(chatId, product.name, meta.candidateVariants, meta.pendingTotalQty ?? null);
            return true;
        }
        meta.step = 'product_select';
        meta.candidateProducts = candidates.map((product) => ({ id: product.id.toString(), name: product.name }));
        await updateGuidedSaleState(pending.id, data, meta);
        const list = meta.candidateProducts.map((product, index) => `${index + 1}) ${product.name}`).join('\n');
        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `Encontre varios productos:\n${list}\nResponde con el numero.` });
        return true;
    }
    if (meta.step === 'quantity' && meta.currentProductId && meta.currentProductName) {
        const qty = parseSingleQuantity(text);
        if (!qty || qty <= 0) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'Escribe una cantidad valida (numero entero mayor a 0).',
            });
            await askGuidedSaleQuantity(chatId, meta.currentProductName, meta.pendingTotalQty ?? null);
            return true;
        }
        if (meta.pendingTotalQty && meta.pendingTotalQty > 0 && qty !== meta.pendingTotalQty) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `La cantidad detectada era ${meta.pendingTotalQty}. Continuare con ${qty}.`,
            });
        }
        return await applyGuidedVariantSelection(pending.id, chatId, data, meta, [buildSimpleGuidedVariant(qty)]);
    }
    if (meta.step === 'variants' && meta.currentProductId && meta.currentProductName && meta.candidateVariants?.length) {
        const wizardEnabled = typeof meta.variantWizardIndex === 'number';
        const candidateVariants = meta.candidateVariants;
        const currentProductName = meta.currentProductName;
        if (wizardEnabled) {
            const totalVariants = candidateVariants.length;
            const sourceValues = Array.isArray(meta.variantWizardValues) ? meta.variantWizardValues : [];
            const draftValues = Array.from({ length: totalVariants }, (_, index) => {
                const raw = Number(sourceValues[index] ?? 0);
                return Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : 0;
            });
            let currentIndex = Math.trunc(meta.variantWizardIndex ?? 0);
            if (currentIndex < 0)
                currentIndex = 0;
            if (currentIndex >= totalVariants)
                currentIndex = totalVariants - 1;
            const finalizeWizard = async () => {
                const totalAssigned = draftValues.reduce((sum, value) => sum + value, 0);
                if (meta.pendingTotalQty && meta.pendingTotalQty > 0 && totalAssigned !== meta.pendingTotalQty) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `Aviso: la suma por variantes fue ${totalAssigned} y la cantidad detectada era ${meta.pendingTotalQty}. Continuare con ${totalAssigned}.`,
                    });
                }
                const capturedVariants = candidateVariants
                    .map((variant, index) => ({
                    variantId: variant.id,
                    attribute: variant.attribute,
                    value: variant.value,
                    qty: draftValues[index] ?? 0,
                    unitPrice: null,
                }))
                    .filter((variant) => variant.qty > 0);
                if (capturedVariants.length === 0) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: 'Todas las variantes quedaron en 0. Ingresa al menos una cantidad mayor a 0.',
                    });
                    resetGuidedVariantWizard(meta, totalVariants);
                    await updateGuidedSaleState(pending.id, data, meta);
                    await askGuidedSaleVariantQuantityStep(chatId, currentProductName, candidateVariants, 0, meta.variantWizardValues ?? [], meta.pendingTotalQty ?? null);
                    return true;
                }
                return await applyGuidedVariantSelection(pending.id, chatId, data, meta, capturedVariants);
            };
            const qty = parseNonNegativeQuantity(text);
            if (qty === null) {
                await telegramClient_1.TelegramClient.sendMessage({
                    chatId,
                    text: 'Escribe solo un numero entero (ej: 0, 5, 20).',
                });
                await askGuidedSaleVariantQuantityStep(chatId, currentProductName, candidateVariants, currentIndex, draftValues, meta.pendingTotalQty ?? null);
                return true;
            }
            draftValues[currentIndex] = qty;
            const nextIndex = currentIndex + 1;
            if (nextIndex < totalVariants) {
                meta.variantWizardIndex = nextIndex;
                meta.variantWizardValues = draftValues;
                await updateGuidedSaleState(pending.id, data, meta);
                await askGuidedSaleVariantQuantityStep(chatId, currentProductName, candidateVariants, nextIndex, draftValues, meta.pendingTotalQty ?? null);
                return true;
            }
            return await finalizeWizard();
        }
        const variants = parseVariantQuantities(text, candidateVariants);
        if (variants.length === 0) {
            if (candidateVariants.length === 1) {
                const qty = parseSingleQuantity(text);
                if (qty) {
                    if (meta.pendingTotalQty && meta.pendingTotalQty > 0 && qty !== meta.pendingTotalQty) {
                        await telegramClient_1.TelegramClient.sendMessage({
                            chatId,
                            text: `La cantidad debe sumar ${meta.pendingTotalQty}. Ajusta el valor y envíalo de nuevo.`,
                        });
                        return true;
                    }
                    const only = candidateVariants[0];
                    return await applyGuidedVariantSelection(pending.id, chatId, data, meta, [
                        {
                            variantId: only.id,
                            attribute: only.attribute,
                            value: only.value,
                            qty,
                            unitPrice: null,
                        },
                    ]);
                }
                await telegramClient_1.TelegramClient.sendMessage({
                    chatId,
                    text: 'Escribe solo la cantidad total (ej: 5).',
                });
                return true;
            }
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'No pude leer las cantidades. Puedes enviar solo los numeros en orden (ej: 4 6 6 8 0) o usar 1=10, 2=5.',
            });
            return true;
        }
        const parsedTotal = variants.reduce((sum, variant) => sum + variant.qty, 0);
        if (meta.pendingTotalQty && meta.pendingTotalQty > 0 && parsedTotal !== meta.pendingTotalQty) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `La suma por variantes fue ${parsedTotal} y debe ser ${meta.pendingTotalQty}. Corrige las cantidades y envíalas de nuevo.`,
            });
            return true;
        }
        return await applyGuidedVariantSelection(pending.id, chatId, data, meta, variants);
    }
    if (meta.step === 'price_apply_parsed') {
        const answer = parseYesNo(text);
        if (answer === null) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Responde "si" o "no".' });
            return true;
        }
        if (answer) {
            const amount = data.unitPrice ?? data.totalAmount ?? 0;
            if (amount <= 0) {
                meta.step = isSimpleGuidedSale(meta) ? 'price_same' : 'price_mode';
                data.unitPrice = null;
                data.totalAmount = null;
                await updateGuidedSaleState(pending.id, data, meta);
                if (isSimpleGuidedSale(meta)) {
                    await askGuidedSalePriceValue(chatId);
                }
                else {
                    await askGuidedSalePrice(chatId);
                }
                return true;
            }
            const totalQty = meta.currentProductId ? (data.items.find((item) => item.productId === meta.currentProductId)?.variants.reduce((sum, v) => sum + v.qty, 0) ?? 0) : 0;
            const unitPrice = data.unitPrice ?? (totalQty > 0 ? Math.round(amount / totalQty) : 0);
            const targetItem = meta.currentProductId ? data.items.find((item) => item.productId === meta.currentProductId) : null;
            if (targetItem) {
                targetItem.variants = targetItem.variants.map((variant) => ({ ...variant, unitPrice }));
            }
            data.unitPrice = null;
            data.totalAmount = null;
            if (shouldBypassGuidedAddMore(meta)) {
                return await advanceAfterItems(pending.id, chatId, data, meta);
            }
            meta.step = 'add_more';
            meta.currentProductId = undefined;
            meta.currentProductName = undefined;
            meta.candidateVariants = undefined;
            meta.candidateProducts = undefined;
            clearGuidedVariantWizard(meta);
            await updateGuidedSaleState(pending.id, data, meta);
            await askGuidedSaleAddMore(chatId);
            return true;
        }
        meta.step = isSimpleGuidedSale(meta) ? 'price_same' : 'price_mode';
        data.unitPrice = null;
        data.totalAmount = null;
        await updateGuidedSaleState(pending.id, data, meta);
        if (isSimpleGuidedSale(meta)) {
            await askGuidedSalePriceValue(chatId);
        }
        else {
            await askGuidedSalePrice(chatId);
        }
        return true;
    }
    if (meta.step === 'price_mode') {
        if (isSimpleGuidedSale(meta)) {
            meta.step = 'price_same';
            await updateGuidedSaleState(pending.id, data, meta);
            await askGuidedSalePriceValue(chatId);
            return true;
        }
        if (!meta.currentProductId) {
            const nextItem = data.items.find((item) => item.variants.some((variant) => !variant.unitPrice || variant.unitPrice <= 0));
            if (nextItem) {
                meta.currentProductId = nextItem.productId;
                meta.currentProductName = nextItem.productName;
                meta.candidateVariants = buildCandidateVariantsFromItem(nextItem);
                await updateGuidedSaleState(pending.id, data, meta);
            }
            else {
                meta.step = 'product';
                await updateGuidedSaleState(pending.id, data, meta);
                await askGuidedSaleProduct(chatId);
                return true;
            }
        }
        const answer = parseYesNo(text);
        if (answer === null) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Responde "si" o "no".' });
            return true;
        }
        if (answer) {
            meta.step = 'price_same';
            await updateGuidedSaleState(pending.id, data, meta);
            await askGuidedSalePriceValue(chatId);
            return true;
        }
        meta.step = 'price_variants';
        const targetItem = meta.currentProductId ? data.items.find((item) => item.productId === meta.currentProductId) ?? null : null;
        if (targetItem) {
            meta.candidateVariants = buildCandidateVariantsFromItem(targetItem);
        }
        if (meta.candidateVariants?.length) {
            resetGuidedPriceVariantWizard(meta, meta.candidateVariants, targetItem);
        }
        else {
            clearGuidedVariantWizard(meta);
        }
        await updateGuidedSaleState(pending.id, data, meta);
        if (meta.currentProductName && meta.candidateVariants?.length) {
            await askGuidedSaleVariantPrices(chatId, meta.currentProductName, meta.candidateVariants);
            await askGuidedSaleVariantPriceStep(chatId, meta.currentProductName, meta.candidateVariants, meta.variantWizardValues ?? [], meta.variantWizardIndex ?? 0);
        }
        else {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude cargar las variantes para precios. Intenta de nuevo o usa "venta guiada".' });
        }
        return true;
    }
    if (meta.step === 'price_same') {
        const amount = parseMoney(text);
        if (!amount || amount <= 0) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No entendi el valor. Dime un numero.' });
            return true;
        }
        const isUnit = /(cada|c\/u|c\.u|unitario|por unidad)/.test(normalized);
        const isTotal = /(total|todos|todo)/.test(normalized);
        if ((isUnit && !isTotal) || (isTotal && !isUnit)) {
            const scope = isUnit ? 'unit' : 'total';
            const targetItem = meta.currentProductId ? data.items.find((item) => item.productId === meta.currentProductId) : null;
            if (!targetItem) {
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude identificar el producto actual. Intenta de nuevo.' });
                return true;
            }
            const totalQty = targetItem.variants.reduce((sum, variant) => sum + variant.qty, 0);
            const unitPrice = scope === 'unit' ? amount : totalQty > 0 ? Math.round(amount / totalQty) : 0;
            targetItem.variants = targetItem.variants.map((variant) => ({ ...variant, unitPrice }));
            meta.pendingPriceAmount = null;
            meta.pendingPriceScope = null;
            data.unitPrice = null;
            data.totalAmount = null;
            if (shouldBypassGuidedAddMore(meta)) {
                return await advanceAfterItems(pending.id, chatId, data, meta);
            }
            meta.step = 'add_more';
            meta.currentProductId = undefined;
            meta.currentProductName = undefined;
            meta.candidateVariants = undefined;
            meta.candidateProducts = undefined;
            clearGuidedVariantWizard(meta);
            await updateGuidedSaleState(pending.id, data, meta);
            await askGuidedSaleAddMore(chatId);
            return true;
        }
        meta.pendingPriceAmount = amount;
        meta.pendingPriceScope = null;
        meta.step = 'price_same_type';
        await updateGuidedSaleState(pending.id, data, meta);
        await askGuidedSalePriceType(chatId);
        return true;
    }
    if (meta.step === 'price_same_type') {
        const amount = meta.pendingPriceAmount ?? 0;
        if (amount <= 0) {
            meta.step = 'price_same';
            await updateGuidedSaleState(pending.id, data, meta);
            await askGuidedSalePriceValue(chatId);
            return true;
        }
        let scope = meta.pendingPriceScope;
        if (!scope) {
            if (/(unitario|cada|por unidad)/.test(normalized))
                scope = 'unit';
            if (/(total|todos|todo)/.test(normalized))
                scope = 'total';
        }
        if (!scope) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Responde "unitario" o "total".' });
            return true;
        }
        const targetItem = meta.currentProductId ? data.items.find((item) => item.productId === meta.currentProductId) : null;
        if (!targetItem) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude identificar el producto actual. Intenta de nuevo.' });
            return true;
        }
        const totalQty = targetItem.variants.reduce((sum, variant) => sum + variant.qty, 0);
        const unitPrice = scope === 'unit' ? amount : totalQty > 0 ? Math.round(amount / totalQty) : 0;
        targetItem.variants = targetItem.variants.map((variant) => ({ ...variant, unitPrice }));
        meta.pendingPriceAmount = null;
        meta.pendingPriceScope = null;
        data.unitPrice = null;
        data.totalAmount = null;
        if (meta.fastMode && !isSimpleGuidedSale(meta)) {
            const remaining = (meta.pendingPriceProductIds ?? []).filter((id) => id !== meta.currentProductId);
            meta.pendingPriceProductIds = remaining;
            if (remaining.length > 0) {
                const nextId = remaining[0];
                const nextItem = data.items.find((item) => item.productId === nextId);
                if (nextItem) {
                    meta.currentProductId = nextItem.productId;
                    meta.currentProductName = nextItem.productName;
                    meta.candidateVariants = buildCandidateVariantsFromItem(nextItem);
                    meta.step = isSimpleGuidedSale(meta) ? 'price_same' : 'price_mode';
                    await updateGuidedSaleState(pending.id, data, meta);
                    if (isSimpleGuidedSale(meta)) {
                        await askGuidedSalePriceValue(chatId);
                    }
                    else {
                        await askGuidedSalePrice(chatId);
                    }
                    return true;
                }
            }
            meta.currentProductId = undefined;
            meta.currentProductName = undefined;
            meta.candidateVariants = undefined;
            meta.candidateProducts = undefined;
            clearGuidedVariantWizard(meta);
            if (data.paymentMethod && /credito|cr[eé]dito/.test(normalizeText(data.paymentMethod)) && !data.creditDueDate) {
                meta.step = 'credit_due';
                await updateGuidedSaleState(pending.id, data, meta);
                await askGuidedSaleCreditDueDate(chatId);
                return true;
            }
            if (!data.paymentMethod) {
                meta.step = 'payment';
                await updateGuidedSaleState(pending.id, data, meta);
                await askGuidedSalePayment(chatId);
                return true;
            }
            if (!data.date) {
                meta.step = 'date';
                await updateGuidedSaleState(pending.id, data, meta);
                await askGuidedSaleDate(chatId);
                return true;
            }
            if (shouldCaptureGuidedDownPayment(data)) {
                meta.step = 'down_payment_confirm';
                await updateGuidedSaleState(pending.id, data, meta);
                await askGuidedSaleDownPayment(chatId);
                return true;
            }
            data.downPaymentAmount = 0;
            await sendGuidedSaleConfirmation(pending.id, chatId, data, meta);
            return true;
        }
        if (meta.skipAddMore) {
            return await advanceAfterItems(pending.id, chatId, data, meta);
        }
        meta.step = 'add_more';
        meta.currentProductId = undefined;
        meta.currentProductName = undefined;
        meta.candidateVariants = undefined;
        meta.candidateProducts = undefined;
        clearGuidedVariantWizard(meta);
        await updateGuidedSaleState(pending.id, data, meta);
        await askGuidedSaleAddMore(chatId);
        return true;
    }
    if (meta.step === 'price_variants') {
        if (!meta.candidateVariants || !meta.currentProductId) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude cargar las variantes. Intenta de nuevo.' });
            return true;
        }
        const targetItem = data.items.find((item) => item.productId === meta.currentProductId);
        if (!targetItem) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude identificar el producto actual. Intenta de nuevo.' });
            return true;
        }
        const candidateVariants = meta.candidateVariants;
        const wizardEnabled = typeof meta.variantWizardIndex === 'number';
        if (wizardEnabled) {
            const draftPrices = candidateVariants.map((variant, index) => {
                const fromItem = Number(targetItem.variants.find((entry) => entry.variantId === variant.id)?.unitPrice ?? 0);
                const fromMeta = Number(meta.variantWizardValues?.[index] ?? 0);
                const price = fromItem > 0 ? fromItem : fromMeta;
                return Number.isFinite(price) && price > 0 ? Math.round(price) : 0;
            });
            let currentIndex = Math.trunc(meta.variantWizardIndex ?? 0);
            if (currentIndex < 0)
                currentIndex = 0;
            if (currentIndex >= candidateVariants.length)
                currentIndex = candidateVariants.length - 1;
            while (currentIndex < candidateVariants.length && draftPrices[currentIndex] > 0) {
                currentIndex += 1;
            }
            if (currentIndex >= candidateVariants.length) {
                const missing = targetItem.variants.filter((variant) => !variant.unitPrice || variant.unitPrice <= 0);
                if (missing.length === 0) {
                    clearGuidedVariantWizard(meta);
                    return await continueAfterGuidedVariantPrices(pending.id, chatId, data, meta);
                }
                resetGuidedPriceVariantWizard(meta, candidateVariants, targetItem);
                await updateGuidedSaleState(pending.id, data, meta);
                if (meta.currentProductName) {
                    await askGuidedSaleVariantPriceStep(chatId, meta.currentProductName, candidateVariants, meta.variantWizardValues ?? [], meta.variantWizardIndex ?? 0);
                }
                return true;
            }
            const price = parseGuidedVariantPriceInput(text);
            if (price === null || price <= 0) {
                meta.variantWizardIndex = currentIndex;
                meta.variantWizardValues = draftPrices;
                await updateGuidedSaleState(pending.id, data, meta);
                await telegramClient_1.TelegramClient.sendMessage({
                    chatId,
                    text: 'No entendí el precio. Escribe solo el valor numérico, por ejemplo: 38000.',
                });
                if (meta.currentProductName) {
                    await askGuidedSaleVariantPriceStep(chatId, meta.currentProductName, candidateVariants, draftPrices, currentIndex);
                }
                return true;
            }
            const nextPrice = Math.round(price);
            const currentVariant = candidateVariants[currentIndex];
            draftPrices[currentIndex] = nextPrice;
            targetItem.variants = targetItem.variants.map((variant) => variant.variantId === currentVariant.id ? { ...variant, unitPrice: nextPrice } : variant);
            let nextIndex = currentIndex + 1;
            while (nextIndex < candidateVariants.length && draftPrices[nextIndex] > 0) {
                nextIndex += 1;
            }
            if (nextIndex < candidateVariants.length) {
                meta.variantWizardIndex = nextIndex;
                meta.variantWizardValues = draftPrices;
                await updateGuidedSaleState(pending.id, data, meta);
                if (meta.currentProductName) {
                    await askGuidedSaleVariantPriceStep(chatId, meta.currentProductName, candidateVariants, draftPrices, nextIndex);
                }
                return true;
            }
            const missing = targetItem.variants.filter((variant) => !variant.unitPrice || variant.unitPrice <= 0);
            if (missing.length > 0) {
                resetGuidedPriceVariantWizard(meta, candidateVariants, targetItem);
                await updateGuidedSaleState(pending.id, data, meta);
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Faltan algunos precios. Continuemos variante por variante.' });
                if (meta.currentProductName) {
                    await askGuidedSaleVariantPriceStep(chatId, meta.currentProductName, candidateVariants, meta.variantWizardValues ?? [], meta.variantWizardIndex ?? 0);
                }
                return true;
            }
            clearGuidedVariantWizard(meta);
            return await continueAfterGuidedVariantPrices(pending.id, chatId, data, meta);
        }
        const pricePairs = [];
        const pairRegex = /([a-zA-Z0-9]+)\s*[:=]\s*([\d.,]+)/g;
        let match = pairRegex.exec(normalized);
        while (match !== null) {
            const key = match[1];
            const price = parseMoney(match[2]);
            if (price === null || price <= 0) {
                match = pairRegex.exec(normalized);
                continue;
            }
            pricePairs.push({ key, price });
            match = pairRegex.exec(normalized);
        }
        const indexMap = new Map();
        for (const [index, variant] of candidateVariants.entries()) {
            indexMap.set(index + 1, variant);
        }
        const prices = new Map();
        pricePairs.forEach((pair) => {
            const asIndex = Number(pair.key);
            if (Number.isFinite(asIndex) && indexMap.has(asIndex)) {
                const variant = indexMap.get(asIndex);
                if (variant)
                    prices.set(variant.id, pair.price);
                return;
            }
            const matched = candidateVariants.find((variant) => normalizeText(variant.value) === pair.key);
            if (matched)
                prices.set(matched.id, pair.price);
        });
        if (prices.size === 0) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude leer los precios. Intenta de nuevo.' });
            return true;
        }
        targetItem.variants = targetItem.variants.map((variant) => ({
            ...variant,
            unitPrice: prices.get(variant.variantId) ?? variant.unitPrice ?? null,
        }));
        const missing = targetItem.variants.filter((variant) => !variant.unitPrice || variant.unitPrice <= 0);
        if (missing.length > 0) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'Faltan precios para algunas variantes. Envia los precios faltantes con el mismo formato.',
            });
            await updateGuidedSaleState(pending.id, data, meta);
            return true;
        }
        clearGuidedVariantWizard(meta);
        return await continueAfterGuidedVariantPrices(pending.id, chatId, data, meta);
    }
    if (meta.step === 'add_more') {
        const answer = parseYesNo(text);
        if (answer === null) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Responde "si" o "no".' });
            return true;
        }
        if (answer) {
            meta.step = 'product';
            await updateGuidedSaleState(pending.id, data, meta);
            await askGuidedSaleProduct(chatId);
            return true;
        }
        if (allVariantsPriced(data)) {
            if (data.paymentMethod) {
                if (/credito|cr[eé]dito/.test(normalizeText(data.paymentMethod)) && !data.creditDueDate) {
                    meta.step = 'credit_due';
                    await updateGuidedSaleState(pending.id, data, meta);
                    await askGuidedSaleCreditDueDate(chatId);
                    return true;
                }
                if (data.date) {
                    if (shouldCaptureGuidedDownPayment(data)) {
                        meta.step = 'down_payment_confirm';
                        await updateGuidedSaleState(pending.id, data, meta);
                        await askGuidedSaleDownPayment(chatId);
                        return true;
                    }
                    data.downPaymentAmount = 0;
                    await sendGuidedSaleConfirmation(pending.id, chatId, data, meta);
                    return true;
                }
                meta.step = 'date';
                await updateGuidedSaleState(pending.id, data, meta);
                await askGuidedSaleDate(chatId);
                return true;
            }
            meta.step = 'payment';
            await updateGuidedSaleState(pending.id, data, meta);
            await askGuidedSalePayment(chatId);
            return true;
        }
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: 'Aun faltan precios para continuar. Completa el precio del producto antes de finalizar.',
        });
        const nextItem = data.items.find((item) => item.variants.some((variant) => !variant.unitPrice || variant.unitPrice <= 0));
        if (!nextItem) {
            meta.step = 'payment';
            await updateGuidedSaleState(pending.id, data, meta);
            await askGuidedSalePayment(chatId);
            return true;
        }
        meta.currentProductId = nextItem.productId;
        meta.currentProductName = nextItem.productName;
        meta.candidateVariants = buildCandidateVariantsFromItem(nextItem);
        meta.step = isSimpleGuidedSale(meta) ? 'price_same' : 'price_mode';
        await updateGuidedSaleState(pending.id, data, meta);
        if (isSimpleGuidedSale(meta)) {
            await askGuidedSalePriceValue(chatId);
        }
        else {
            await askGuidedSalePrice(chatId);
        }
        return true;
    }
    if (meta.step === 'payment') {
        data.paymentMethod = text;
        if (/credito|cr[eé]dito/.test(normalized)) {
            meta.step = 'credit_due';
            await updateGuidedSaleState(pending.id, data, meta);
            await askGuidedSaleCreditDueDate(chatId);
            return true;
        }
        data.creditDueDate = null;
        meta.pendingCreditTermAmount = null;
        meta.pendingCreditTermUnit = null;
        meta.step = 'date';
        await updateGuidedSaleState(pending.id, data, meta);
        await askGuidedSaleDate(chatId);
        return true;
    }
    if (meta.step === 'credit_due') {
        const parsedDue = parseCreditDueInput(text, data.date ?? null);
        if (!parsedDue) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'No entendí el plazo. Ejemplos: `15 dias`, `1 semana`, `1 mes` o fecha `2026-04-20`.',
                parseMode: 'Markdown',
            });
            return true;
        }
        if (parsedDue.dueDate) {
            data.creditDueDate = parsedDue.dueDate;
            meta.pendingCreditTermAmount = null;
            meta.pendingCreditTermUnit = null;
        }
        else if (parsedDue.termAmount && parsedDue.termUnit) {
            data.creditDueDate = null;
            meta.pendingCreditTermAmount = parsedDue.termAmount;
            meta.pendingCreditTermUnit = parsedDue.termUnit;
        }
        if (data.date) {
            if (!data.creditDueDate && meta.pendingCreditTermAmount && meta.pendingCreditTermUnit) {
                const dueDate = addCreditTermToDate(data.date, meta.pendingCreditTermAmount, meta.pendingCreditTermUnit);
                if (dueDate)
                    data.creditDueDate = dueDate;
                meta.pendingCreditTermAmount = null;
                meta.pendingCreditTermUnit = null;
            }
            if (shouldCaptureGuidedDownPayment(data)) {
                meta.step = 'down_payment_confirm';
                await updateGuidedSaleState(pending.id, data, meta);
                await askGuidedSaleDownPayment(chatId);
                return true;
            }
            data.downPaymentAmount = 0;
            await sendGuidedSaleConfirmation(pending.id, chatId, data, meta);
            return true;
        }
        meta.step = 'date';
        await updateGuidedSaleState(pending.id, data, meta);
        await askGuidedSaleDate(chatId);
        return true;
    }
    if (meta.step === 'date') {
        const date = parseDateInput(text);
        if (!date) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No entendi la fecha. Usa YYYY-MM-DD o "hoy".' });
            return true;
        }
        data.date = date;
        if (meta.pendingCreditTermAmount && meta.pendingCreditTermUnit) {
            const dueDate = addCreditTermToDate(date, meta.pendingCreditTermAmount, meta.pendingCreditTermUnit);
            if (dueDate)
                data.creditDueDate = dueDate;
            meta.pendingCreditTermAmount = null;
            meta.pendingCreditTermUnit = null;
        }
        if (shouldCaptureGuidedDownPayment(data)) {
            meta.step = 'down_payment_confirm';
            await updateGuidedSaleState(pending.id, data, meta);
            await askGuidedSaleDownPayment(chatId);
            return true;
        }
        data.downPaymentAmount = 0;
        await sendGuidedSaleConfirmation(pending.id, chatId, data, meta);
        return true;
    }
    if (meta.step === 'down_payment_confirm') {
        const answer = parseYesNo(text);
        if (answer === null) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Responde "si" o "no".' });
            return true;
        }
        if (!answer) {
            data.downPaymentAmount = 0;
            await sendGuidedSaleConfirmation(pending.id, chatId, data, meta);
            return true;
        }
        if (!shouldCaptureGuidedDownPayment(data)) {
            data.downPaymentAmount = 0;
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'El abono solo aplica para ventas a crédito con cliente. Continuaremos sin abono.' });
            await sendGuidedSaleConfirmation(pending.id, chatId, data, meta);
            return true;
        }
        meta.step = 'down_payment_amount';
        await updateGuidedSaleState(pending.id, data, meta);
        await askGuidedSaleDownPaymentAmount(chatId);
        return true;
    }
    if (meta.step === 'down_payment_amount') {
        const amount = parseMoney(text);
        const totalAmount = Math.round(computeTotalAmount(data));
        if (!amount || amount <= 0) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Monto inválido. Escribe solo números, por ejemplo: 200000.' });
            return true;
        }
        if (amount > totalAmount) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `El abono no puede ser mayor al total (${formatCurrency(totalAmount)}).`,
            });
            return true;
        }
        data.downPaymentAmount = Math.round(amount);
        await sendGuidedSaleConfirmation(pending.id, chatId, data, meta);
        return true;
    }
    if (meta.step === 'confirm') {
        if (!/(confirmar|si|sí)/.test(normalized)) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Escribe "confirmar" para registrar o "cancelar" para salir.' });
            return true;
        }
        const totalQty = computeTotalQty(data);
        if (totalQty <= 0) {
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No hay cantidades validas. Inicia la venta de nuevo.' });
            await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CANCELLED');
            return true;
        }
        if (!allVariantsPriced(data)) {
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'Faltan precios en algunas variantes. Completa los precios antes de confirmar.',
            });
            return true;
        }
        const totalAmount = Math.round(computeTotalAmount(data));
        const isCreditSale = isGuidedSaleCredit(data);
        const downPaymentAmount = isCreditSale ? Math.max(0, Math.round(Number(data.downPaymentAmount ?? 0))) : 0;
        const unitPrice = totalQty > 0 ? Math.round(totalAmount / totalQty) : 0;
        const items = data.items.flatMap((item) => item.variants.map((variant) => ({
            productId: item.productId,
            variantId: variant.variantId,
            qty: variant.qty,
        })));
        const confirmResult = await dependencies_1.inventoryGateway.confirmSale({
            companyId: pending.companyId,
            saleId: data.saleId,
            items,
            reference: 'telegram-sale',
        });
        if (!confirmResult.ok) {
            const error = confirmResult.error;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: formatInventoryConfirmErrorMessage(data, error),
            });
            return true;
        }
        const costTotal = confirmResult.value.costTotal;
        const unitCost = totalQty > 0 ? costTotal / totalQty : 0;
        try {
            await registerSale({
                description: buildSaleDescription(data),
                totalAmount,
                date: data.date ?? new Date().toISOString(),
                includesVAT: false,
                includesCost: true,
                quantity: totalQty,
                unitCost,
                unitPrice,
                customerName: data.customerName ?? undefined,
                paymentMethod: data.paymentMethod ?? undefined,
                companyId: pending.companyId,
            });
        }
        catch (error) {
            await dependencies_1.inventoryGateway.reverseSale({
                companyId: pending.companyId,
                saleId: data.saleId,
                items,
                reason: 'rollback sale error',
            });
            const message = error instanceof Error ? error.message : 'Error interno registrando la venta';
            await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No pude registrar la venta: ${message}` });
            return true;
        }
        await dependencies_1.pendingEventRepository.updateStatus(pending.id, 'CONFIRMED');
        await telegramClient_1.TelegramClient.sendMessage({
            chatId,
            text: '✅ Venta registrada y stock actualizado.',
        });
        if (downPaymentAmount > 0) {
            const customerName = data.customerName?.trim();
            if (customerName && normalizeText(customerName) !== 'sin cliente') {
                try {
                    await registerCustomerPayment({
                        companyId: pending.companyId,
                        amount: downPaymentAmount,
                        date: data.date ?? new Date().toISOString(),
                        paymentMethod: data.paymentMethod ?? undefined,
                        customerName,
                        allowClosedReopen: true,
                        description: `Abono inicial de venta ${data.saleId}`,
                    });
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `✅ Abono registrado por ${formatCurrency(downPaymentAmount)} a nombre de ${customerName}.`,
                    });
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : 'Error interno registrando abono';
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `⚠️ La venta quedó registrada, pero no pude registrar el abono: ${message}`,
                    });
                }
            }
            else {
                await telegramClient_1.TelegramClient.sendMessage({
                    chatId,
                    text: '⚠️ Había abono, pero no hay cliente válido para registrarlo automáticamente.',
                });
            }
        }
        const invoiceItems = data.items.flatMap((item) => item.variants.map((variant) => ({
            description: isSimpleGuidedVariant(variant) ? item.productName : `${item.productName} - ${variant.attribute} ${variant.value}`,
            qty: variant.qty,
            unitPrice: variant.unitPrice ?? unitPrice,
            lineTotal: Math.round((variant.unitPrice ?? unitPrice) * variant.qty),
        })));
        const invoiceCustomer = data.customerName?.trim() && data.customerName.trim().toLowerCase() !== 'sin cliente'
            ? await dependencies_1.arCustomerRepository.findByNormalizedName(pending.companyId, (0, normalizeCustomerName_1.normalizeCustomerName)(data.customerName))
            : null;
        const companySettings = await dependencies_1.invoiceIssuerSettingsRepository.getByCompanyId(pending.companyId);
        const user = await dependencies_1.userRepository.findByTelegramId(chatId);
        await startInvoiceSignatureFlow({
            chatId,
            companyId: pending.companyId,
            invoice: {
                companyId: pending.companyId,
                companyName: companySettings?.companyName ?? null,
                companyTaxId: companySettings?.taxId ?? null,
                companyPhone: companySettings?.contactPhone ?? null,
                companyAddress: companySettings?.address ?? null,
                customerName: data.customerName ?? null,
                customerDocumentNumber: invoiceCustomer?.documentNumber ?? null,
                customerPhone: invoiceCustomer?.phone ?? null,
                customerCity: invoiceCustomer?.city ?? null,
                customerAddress: invoiceCustomer?.address ?? null,
                date: formatDate(data.date ?? null),
                paymentMethod: data.paymentMethod ?? null,
                creditDueDate: data.creditDueDate ?? null,
                totalAmount,
                downPaymentAmount,
                showCreditBreakdown: isCreditSale,
                items: invoiceItems,
                invoiceFilename: `factura-${formatDate(data.date ?? null)}.pdf`,
                sellerName: user?.name ?? 'Vendedor',
            },
        });
        return true;
    }
    return false;
};
const executeSale = async (chatId, saleInput) => {
    const input = { ...saleInput, allowClosedReopen: true };
    const previousOpen = await dependencies_1.accountingPeriodRepository.findOpenByCompany(input.companyId);
    const result = await registerSale(input);
    const entradas = result.movements.filter((m) => m.type === 'debit');
    const salidas = result.movements.filter((m) => m.type !== 'debit');
    const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n');
    const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n');
    const movementsText = [];
    if (entradas.length > 0)
        movementsText.push(`Entradas 🟢:\n${entradasText}`);
    if (salidas.length > 0)
        movementsText.push(`Salidas 📴:\n${salidasText}`);
    const movementsTextFinal = movementsText.join('\n\n');
    const isPending = result.status === 'pending';
    const statusIcon = isPending ? '📋' : '✅';
    const statusText = isPending ? '*Borrador guardado (Incompleto)*' : '*Venta registrada correctamente*';
    const periodLabel = await getPeriodLabel(input.companyId, result.periodId);
    const summary = `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${input.totalAmount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Completa los datos faltantes en el panel administrativo._' : ''}
        `.trim();
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: summary,
        parseMode: 'Markdown',
    });
    if (previousOpen.length > 0 && previousOpen[0].id !== result.periodId) {
        await dependencies_1.accountingPeriodRepository.markOpenExclusive(input.companyId, previousOpen[0].id);
    }
    await markPeriodPendingIfReopened(input.companyId, result.periodId);
};
const executePurchase = async (chatId, purchaseInput) => {
    const input = { ...purchaseInput, allowClosedReopen: true };
    const previousOpen = input.companyId ? await dependencies_1.accountingPeriodRepository.findOpenByCompany(input.companyId) : [];
    const result = await registerPurchase(input);
    const entradas = result.movements.filter((m) => m.type === 'debit');
    const salidas = result.movements.filter((m) => m.type !== 'debit');
    const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n');
    const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n');
    const movementsText = [];
    if (entradas.length > 0)
        movementsText.push(`Entradas 🟢:\n${entradasText}`);
    if (salidas.length > 0)
        movementsText.push(`Salidas 📴:\n${salidasText}`);
    const movementsTextFinal = movementsText.join('\n\n');
    const isPending = result.status === 'pending';
    const statusIcon = isPending ? '📋' : '✅';
    const statusText = isPending ? '*Borrador de Compra (Incompleto)*' : '*Compra registrada correctamente*';
    const periodLabel = input.companyId ? await getPeriodLabel(input.companyId, result.periodId) : 'no asignado';
    const summary = `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${input.amount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Completa los detalles en el panel administrativo._' : ''}
        `.trim();
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: summary,
        parseMode: 'Markdown',
    });
    if (input.companyId && previousOpen.length > 0 && previousOpen[0].id !== result.periodId) {
        await dependencies_1.accountingPeriodRepository.markOpenExclusive(input.companyId, previousOpen[0].id);
    }
    if (input.companyId) {
        await markPeriodPendingIfReopened(input.companyId, result.periodId);
    }
};
const executePayroll = async (chatId, payrollInput) => {
    const input = { ...payrollInput, allowClosedReopen: true };
    const previousOpen = await dependencies_1.accountingPeriodRepository.findOpenByCompany(input.companyId);
    const result = await registerPayroll(input);
    const entradas = result.movements.filter((m) => m.type === 'debit');
    const salidas = result.movements.filter((m) => m.type !== 'debit');
    const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n');
    const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n');
    const movementsText = [];
    if (entradas.length > 0)
        movementsText.push(`Entradas 🟢:\n${entradasText}`);
    if (salidas.length > 0)
        movementsText.push(`Salidas 📴:\n${salidasText}`);
    const movementsTextFinal = movementsText.join('\n\n');
    const isPending = result.status === 'pending';
    const statusIcon = isPending ? '📋' : '✅';
    const statusText = isPending ? '*Borrador de Nomina (Incompleto)*' : '*Pago de nomina registrado*';
    const periodLabel = await getPeriodLabel(input.companyId, result.periodId);
    const summary = `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${input.amount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Recuerda completar la informacion en el panel._' : ''}
        `.trim();
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: summary,
        parseMode: 'Markdown',
    });
    if (previousOpen.length > 0 && previousOpen[0].id !== result.periodId) {
        await dependencies_1.accountingPeriodRepository.markOpenExclusive(input.companyId, previousOpen[0].id);
    }
    await markPeriodPendingIfReopened(input.companyId, result.periodId);
};
const executeCustomerPayment = async (chatId, paymentInput) => {
    const amount = Number(paymentInput.amount ?? 0);
    const result = await registerCustomerPayment({
        companyId: paymentInput.companyId,
        amount,
        date: paymentInput.date ?? undefined,
        periodHint: paymentInput.periodHint ?? undefined,
        paymentMethod: paymentInput.paymentMethod ?? undefined,
        customerName: paymentInput.customerName,
        allowClosedReopen: true,
        description: `Pago de ${paymentInput.customerName}`,
    });
    const entradas = result.movements.filter((m) => m.type === 'debit');
    const salidas = result.movements.filter((m) => m.type !== 'debit');
    const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n');
    const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n');
    const movementsText = [];
    if (entradas.length > 0)
        movementsText.push(`Entradas 🟢:\n${entradasText}`);
    if (salidas.length > 0)
        movementsText.push(`Salidas 📴:\n${salidasText}`);
    const movementsTextFinal = movementsText.join('\n\n');
    const isPending = result.status === 'pending';
    const statusIcon = isPending ? '📋' : '✅';
    const statusText = isPending ? '*Borrador de Pago (Incompleto)*' : '*Pago de cliente registrado*';
    const periodLabel = await getPeriodLabel(paymentInput.companyId, result.periodId);
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${amount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Completa los detalles en el panel administrativo._' : ''}
          `.trim(),
        parseMode: 'Markdown',
    });
    if (result.periodId) {
        await markPeriodPendingIfReopened(paymentInput.companyId, result.periodId);
    }
};
const executeSupplierPayment = async (chatId, paymentInput) => {
    const amount = Number(paymentInput.amount ?? 0);
    const result = await registerSupplierPayment({
        companyId: paymentInput.companyId,
        amount,
        date: paymentInput.date ?? undefined,
        periodHint: paymentInput.periodHint ?? undefined,
        paymentMethod: paymentInput.paymentMethod ?? undefined,
        supplierName: paymentInput.supplierName,
        allowClosedReopen: true,
        description: `Pago a ${paymentInput.supplierName}`,
    });
    const entradas = result.movements.filter((m) => m.type === 'debit');
    const salidas = result.movements.filter((m) => m.type !== 'debit');
    const entradasText = entradas.map((m) => `+ ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n');
    const salidasText = salidas.map((m) => `- ${m.accountName}: ${formatCurrency(m.amount)}`).join('\n');
    const movementsText = [];
    if (entradas.length > 0)
        movementsText.push(`Entradas 🟢:\n${entradasText}`);
    if (salidas.length > 0)
        movementsText.push(`Salidas 📴:\n${salidasText}`);
    const movementsTextFinal = movementsText.join('\n\n');
    const isPending = result.status === 'pending';
    const statusIcon = isPending ? '📋' : '✅';
    const statusText = isPending ? '*Borrador de Pago (Incompleto)*' : '*Pago a proveedor registrado*';
    const periodLabel = await getPeriodLabel(paymentInput.companyId, result.periodId);
    await telegramClient_1.TelegramClient.sendMessage({
        chatId,
        text: `
${statusIcon} ${statusText}

*Descripcion:* ${result.description}
*Total:* ${amount}
*Fecha del asiento:* ${formatDate(result.date)}
*Periodo:* ${periodLabel}

*Movimientos contables:*
${movementsTextFinal}

${isPending ? '_Completa los detalles en el panel administrativo._' : ''}
          `.trim(),
        parseMode: 'Markdown',
    });
    if (result.periodId) {
        await markPeriodPendingIfReopened(paymentInput.companyId, result.periodId);
    }
};
router.get('/sign-session/:pendingId', async (req, res) => {
    const { pendingId } = req.params;
    const token = String(req.query.token ?? '');
    if (!pendingId || !token)
        return res.status(400).json({ ok: false, message: 'Enlace inválido' });
    const pending = await dependencies_1.pendingEventRepository.findById(pendingId);
    if (!pending || pending.eventType !== 'invoice_signature') {
        return res.status(404).json({ ok: false, message: 'Firma no encontrada' });
    }
    const state = await ensurePendingState(pending);
    if (!state || state.status !== 'PENDING_CONFIRMATION') {
        return res.status(410).json({ ok: false, message: 'Esta sesión de firma ya no está disponible' });
    }
    const meta = getInvoiceSignatureMeta(state.pending);
    if (!meta || meta.token !== token) {
        return res.status(403).json({ ok: false, message: 'Token de firma inválido' });
    }
    const invoice = state.pending.interpretedData;
    const groupedProducts = new Map();
    const rawItems = Array.isArray(invoice.items) ? invoice.items : [];
    for (const entry of rawItems) {
        const description = String(entry?.description ?? '').trim();
        const qty = Number(entry?.qty ?? 0);
        const unitPrice = Number(entry?.unitPrice ?? 0);
        const rawLineTotal = Number(entry?.lineTotal ?? qty * unitPrice);
        const safeQty = Number.isFinite(qty) && qty > 0 ? Math.round(qty) : 0;
        const safeUnitPrice = Number.isFinite(unitPrice) && unitPrice >= 0 ? Math.round(unitPrice) : 0;
        const safeLineTotal = Number.isFinite(rawLineTotal) ? Math.round(rawLineTotal) : Math.round(safeQty * safeUnitPrice);
        const separatorIndex = description.indexOf(' - ');
        const productName = (separatorIndex >= 0 ? description.slice(0, separatorIndex).trim() : description) || 'Producto';
        const lineLabel = (separatorIndex >= 0 ? description.slice(separatorIndex + 3).trim() : description) || 'Detalle';
        const current = groupedProducts.get(productName);
        const line = { label: lineLabel, qty: safeQty, unitPrice: safeUnitPrice, subtotal: safeLineTotal };
        if (!current) {
            groupedProducts.set(productName, {
                name: productName,
                subtotal: safeLineTotal,
                lines: [line],
            });
            continue;
        }
        current.subtotal += safeLineTotal;
        current.lines.push(line);
    }
    const products = Array.from(groupedProducts.values());
    const totalUnits = products.reduce((sum, product) => sum + product.lines.reduce((inner, line) => inner + line.qty, 0), 0);
    const totalAmount = Number(invoice.totalAmount ?? 0);
    const downPaymentAmount = Number(invoice.downPaymentAmount ?? 0);
    const safeDownPaymentAmount = Number.isFinite(downPaymentAmount) && downPaymentAmount > 0 ? Math.round(downPaymentAmount) : 0;
    const pendingBalance = Math.max(0, Math.round(totalAmount - safeDownPaymentAmount));
    return res.status(200).json({
        ok: true,
        pendingId: state.pending.id,
        step: meta.step,
        customerName: invoice.customerName ?? 'Cliente',
        sellerName: invoice.sellerName ?? 'Vendedor',
        totalAmount,
        date: invoice.date,
        paymentMethod: invoice.paymentMethod ?? null,
        creditDueDate: invoice.creditDueDate ?? null,
        downPaymentAmount: safeDownPaymentAmount,
        pendingBalance: invoice.showCreditBreakdown ? pendingBalance : null,
        totalUnits,
        saleSummary: {
            customerName: invoice.customerName ?? 'Cliente',
            date: invoice.date,
            paymentMethod: invoice.paymentMethod ?? null,
            paymentDueDate: invoice.creditDueDate ?? null,
            totalAmount,
            downPayment: safeDownPaymentAmount,
            pendingBalance: invoice.showCreditBreakdown ? pendingBalance : null,
            totalUnits,
            products,
        },
    });
});
router.post('/sign-session/:pendingId/submit', async (req, res) => {
    const { pendingId } = req.params;
    const token = String(req.query.token ?? '');
    const role = req.body?.role === 'customer' ? 'customer' : req.body?.role === 'seller' ? 'seller' : null;
    const signatureDataUrl = normalizeSignatureDataUrl(req.body?.signatureDataUrl);
    if (!pendingId || !token || !role || !signatureDataUrl) {
        return res.status(400).json({ ok: false, message: 'Solicitud inválida. Revisa firma y enlace.' });
    }
    const pending = await dependencies_1.pendingEventRepository.findById(pendingId);
    if (!pending || pending.eventType !== 'invoice_signature') {
        return res.status(404).json({ ok: false, message: 'Firma no encontrada' });
    }
    const state = await ensurePendingState(pending);
    if (!state || state.status !== 'PENDING_CONFIRMATION') {
        return res.status(410).json({ ok: false, message: 'Esta sesión de firma ya no está disponible' });
    }
    const meta = getInvoiceSignatureMeta(state.pending);
    if (!meta || meta.token !== token) {
        return res.status(403).json({ ok: false, message: 'Token de firma inválido' });
    }
    if (meta.step !== role) {
        return res.status(409).json({ ok: false, message: `Ahora corresponde firma de ${meta.step === 'seller' ? 'vendedor' : 'cliente'}` });
    }
    const nowIso = new Date().toISOString();
    const nextStep = role === 'seller' ? 'customer' : 'done';
    const nextMeta = {
        ...meta,
        step: nextStep,
        sellerSignatureDataUrl: role === 'seller' ? signatureDataUrl : meta.sellerSignatureDataUrl ?? null,
        customerSignatureDataUrl: role === 'customer' ? signatureDataUrl : meta.customerSignatureDataUrl ?? null,
        sellerSignedAt: role === 'seller' ? nowIso : meta.sellerSignedAt ?? null,
        customerSignedAt: role === 'customer' ? nowIso : meta.customerSignedAt ?? null,
    };
    await dependencies_1.pendingEventRepository.updateData(state.pending.id, state.pending.interpretedData, nextMeta);
    if (nextStep === 'done') {
        await dependencies_1.pendingEventRepository.updateStatus(state.pending.id, 'CONFIRMED');
        await completeSignedInvoiceForPending(state.pending, nextMeta);
        await telegramClient_1.TelegramClient.sendMessage({
            chatId: state.pending.telegramUserId,
            text: '✅ Factura firmada por ambas partes y enviada.',
        });
    }
    return res.status(200).json({
        ok: true,
        step: nextStep,
        done: nextStep === 'done',
        message: nextStep === 'done' ? 'Firmas completadas.' : 'Firma guardada. Ahora debe firmar el cliente.',
    });
});
router.post('/webhook', async (req, res) => {
    const update = req.body;
    const chatId = update?.message?.chat?.id ?? update?.callback_query?.message?.chat?.id ?? null;
    try {
        const messageId = update?.message?.message_id ?? null;
        if (chatId && messageId) {
            const lastId = lastTelegramMessageIdByChat.get(chatId);
            if (lastId === messageId) {
                return res.status(200).json({ ok: true });
            }
            lastTelegramMessageIdByChat.set(chatId, messageId);
        }
        await dependencies_1.pendingEventRepository.expirePastDue();
        if (update?.callback_query) {
            const callback = update.callback_query;
            const signParsed = parseSignCallbackData(callback.data);
            if (signParsed && ensureChatId(chatId, res)) {
                await telegramClient_1.TelegramClient.answerCallbackQuery(callback.id);
                if (signParsed.action !== SIGN_CALLBACK_ACTIONS.copy) {
                    return res.status(200).json({ ok: true });
                }
                const pending = await dependencies_1.pendingEventRepository.findById(signParsed.pendingId);
                const pendingState = await ensurePendingState(pending);
                if (!pendingState || pendingState.pending.eventType !== 'invoice_signature') {
                    await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Esta sesión de firma ya no está disponible.' });
                    return res.status(200).json({ ok: true });
                }
                const meta = getInvoiceSignatureMeta(pendingState.pending);
                if (!meta) {
                    await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude generar el enlace de firma.' });
                    return res.status(200).json({ ok: true });
                }
                const signUrl = `${getSignatureFrontendBaseUrl()}/telegram-sign/${pendingState.pending.id}?token=${meta.token}`;
                await telegramClient_1.TelegramClient.sendMessage({
                    chatId,
                    text: `Enlace de firma:\n${signUrl}`,
                });
                return res.status(200).json({ ok: true });
            }
            const guidedParsed = parseGuidedCallbackData(callback.data);
            if (guidedParsed && ensureChatId(chatId, res)) {
                await telegramClient_1.TelegramClient.answerCallbackQuery(callback.id);
                const pendingSale = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'sale_guided');
                const saleState = await ensurePendingState(pendingSale);
                if (saleState && saleState.status === 'PENDING_CONFIRMATION') {
                    const action = guidedParsed.action;
                    const mapped = mapGuidedSaleCallbackActionToText(action);
                    if (!mapped) {
                        return res.status(200).json({ ok: true });
                    }
                    await handleGuidedSaleMessage(saleState.pending, chatId, mapped);
                    return res.status(200).json({ ok: true });
                }
                const pendingCustomer = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'customer_guided');
                const customerState = await ensurePendingState(pendingCustomer);
                if (customerState && customerState.status === 'PENDING_CONFIRMATION') {
                    await handleGuidedCustomerCallback(customerState.pending, chatId, guidedParsed.action);
                    return res.status(200).json({ ok: true });
                }
                const pendingInvoiceIssuer = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'invoice_issuer_guided');
                const invoiceIssuerState = await ensurePendingState(pendingInvoiceIssuer);
                if (invoiceIssuerState && invoiceIssuerState.status === 'PENDING_CONFIRMATION') {
                    await handleGuidedInvoiceIssuerCallback(invoiceIssuerState.pending, chatId, guidedParsed.action);
                    return res.status(200).json({ ok: true });
                }
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Este evento ya no esta disponible.' });
                return res.status(200).json({ ok: true });
            }
            const parsed = parseCallbackData(callback.data);
            if (parsed && ensureChatId(chatId, res)) {
                await telegramClient_1.TelegramClient.answerCallbackQuery(callback.id);
                const pending = await dependencies_1.pendingEventRepository.findById(parsed.pendingId);
                const pendingState = await ensurePendingState(pending);
                if (!pendingState) {
                    await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Este evento ya no esta disponible.' });
                    return res.status(200).json({ ok: true });
                }
                if (pendingState.status === 'EXPIRED') {
                    await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Este evento expiro y no se ejecutara.' });
                    return res.status(200).json({ ok: true });
                }
                if (pendingState.status !== 'PENDING_CONFIRMATION') {
                    await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Este evento ya no esta disponible.' });
                    return res.status(200).json({ ok: true });
                }
                if (parsed.action === CALLBACK_ACTIONS.cancel) {
                    await dependencies_1.pendingEventRepository.updateStatus(pendingState.pending.id, 'CANCELLED');
                    await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Operacion cancelada.' });
                    return res.status(200).json({ ok: true });
                }
                const eventType = pendingState.pending.eventType;
                const rawData = pendingState.pending.interpretedData;
                let customerNameOverride = null;
                let supplierNameOverride = null;
                if (parsed.action === CALLBACK_ACTIONS.confirmCustomer) {
                    if (!parsed.entityId) {
                        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude identificar el cliente seleccionado.' });
                        return res.status(200).json({ ok: true });
                    }
                    const customer = await dependencies_1.arCustomerRepository.findById(parsed.entityId);
                    if (!customer || customer.companyId !== pendingState.pending.companyId) {
                        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'El cliente seleccionado no es valido.' });
                        return res.status(200).json({ ok: true });
                    }
                    customerNameOverride = customer.name;
                }
                if (parsed.action === CALLBACK_ACTIONS.confirmNew) {
                    const originalName = rawData.customerName;
                    if (!originalName?.trim()) {
                        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude identificar el nombre del cliente.' });
                        return res.status(200).json({ ok: true });
                    }
                    customerNameOverride = originalName;
                }
                if (parsed.action === CALLBACK_ACTIONS.confirmSupplier) {
                    if (!parsed.entityId) {
                        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude identificar el proveedor seleccionado.' });
                        return res.status(200).json({ ok: true });
                    }
                    const supplier = await dependencies_1.apSupplierRepository.findById(parsed.entityId);
                    if (!supplier || supplier.companyId !== pendingState.pending.companyId) {
                        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'El proveedor seleccionado no es valido.' });
                        return res.status(200).json({ ok: true });
                    }
                    supplierNameOverride = supplier.name;
                }
                if (parsed.action === CALLBACK_ACTIONS.confirmNewSupplier) {
                    const originalName = rawData.supplier ?? rawData.supplierName;
                    if (!originalName?.trim()) {
                        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'No pude identificar el nombre del proveedor.' });
                        return res.status(200).json({ ok: true });
                    }
                    supplierNameOverride = originalName;
                }
                if (parsed.action === CALLBACK_ACTIONS.confirm ||
                    parsed.action === CALLBACK_ACTIONS.confirmCustomer ||
                    parsed.action === CALLBACK_ACTIONS.confirmNew ||
                    parsed.action === CALLBACK_ACTIONS.confirmSupplier ||
                    parsed.action === CALLBACK_ACTIONS.confirmNewSupplier) {
                    try {
                        if (eventType === 'sale') {
                            const saleInput = rawData;
                            const updated = customerNameOverride ? { ...saleInput, customerName: customerNameOverride } : saleInput;
                            await executeSale(chatId, updated);
                        }
                        if (eventType === 'purchase') {
                            const purchaseInput = rawData;
                            const updated = supplierNameOverride ? { ...purchaseInput, supplier: supplierNameOverride } : purchaseInput;
                            await executePurchase(chatId, updated);
                        }
                        if (eventType === 'payroll') {
                            await executePayroll(chatId, rawData);
                        }
                        if (eventType === 'customer_payment') {
                            const paymentInput = rawData;
                            const updated = customerNameOverride ? { ...paymentInput, customerName: customerNameOverride } : paymentInput;
                            await executeCustomerPayment(chatId, updated);
                        }
                        if (eventType === 'supplier_payment') {
                            const paymentInput = rawData;
                            const updated = supplierNameOverride ? { ...paymentInput, supplierName: supplierNameOverride } : paymentInput;
                            await executeSupplierPayment(chatId, updated);
                        }
                        await dependencies_1.pendingEventRepository.updateStatus(pendingState.pending.id, 'CONFIRMED');
                    }
                    catch (err) {
                        const message = err instanceof Error ? err.message : 'No pude ejecutar la operacion';
                        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No pude ejecutar la operacion: ${message}` });
                    }
                    return res.status(200).json({ ok: true });
                }
            }
            return res.status(200).json({ ok: true });
        }
        const message = update?.message;
        const rawText = message ? await telegramAdapter_1.TelegramAdapter.getMessageText(message) : null;
        const directText = message?.text?.trim() ?? null;
        const textForCommand = directText ?? rawText;
        if (textForCommand && chatId) {
            const normalizedCommand = normalizeText(textForCommand);
            if (normalizedCommand === 'cancelar firma' || normalizedCommand === 'cancelar_firma') {
                const pendingSign = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'invoice_signature');
                if (pendingSign?.status === 'PENDING_CONFIRMATION') {
                    await dependencies_1.pendingEventRepository.updateStatus(pendingSign.id, 'CANCELLED');
                    await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Firma de factura cancelada. La venta quedó registrada.' });
                    return res.status(200).json({ ok: true });
                }
            }
            const guided = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'sale_guided');
            if (guided && rawText) {
                if (looksLikeNewSaleMessage(rawText)) {
                    await dependencies_1.pendingEventRepository.updateStatus(guided.id, 'CANCELLED');
                }
                else {
                    const handled = await handleGuidedSaleMessage(guided, chatId, rawText);
                    if (handled)
                        return res.status(200).json({ ok: true });
                }
            }
            const guidedCustomer = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'customer_guided');
            if (guidedCustomer && rawText) {
                const handled = await handleGuidedCustomerMessage(guidedCustomer, chatId, rawText);
                if (handled)
                    return res.status(200).json({ ok: true });
            }
            const guidedInvoiceIssuer = await dependencies_1.pendingEventRepository.findLatestPendingByTelegramUserId(chatId, 'invoice_issuer_guided');
            if (guidedInvoiceIssuer && rawText) {
                const handled = await handleGuidedInvoiceIssuerMessage(guidedInvoiceIssuer, chatId, rawText);
                if (handled)
                    return res.status(200).json({ ok: true });
            }
            if (textForCommand && isSalesMetricsQuery(textForCommand)) {
                const user = await dependencies_1.userRepository.findByTelegramId(chatId);
                if (!user) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `No tienes un usuario asignado. Envia este ID a soporte: ${chatId}`,
                    });
                    return res.status(200).json({ ok: true });
                }
                try {
                    const period = parseSalesMetricsPeriod(textForCommand);
                    const summary = await getSalesMetricsSummary(user.companyId, period);
                    const periodLabel = period.start === period.end ? period.start : `${period.start} a ${period.end}`;
                    const topProductLine = summary.topProductQty > 0
                        ? `🏆 Producto más vendido: ${summary.topProductName ?? 'sin dato'} (${summary.topProductQty} unidades)`
                        : '🏆 Producto más vendido: sin ventas en el periodo';
                    const otherProducts = summary.productBreakdown.slice(1);
                    const maxOtherProductsToShow = 8;
                    const visibleOthers = otherProducts.slice(0, maxOtherProductsToShow);
                    const hiddenOthers = Math.max(otherProducts.length - visibleOthers.length, 0);
                    const otherProductsLine = summary.topProductQty <= 0
                        ? '📦 Otros productos: sin ventas en el periodo'
                        : otherProducts.length === 0
                            ? '📦 Otros productos: no hubo más productos vendidos'
                            : `📦 Otros productos:\n${visibleOthers.map((item) => `- ${item.productName}: ${item.qty} unidades`).join('\n')}${hiddenOthers > 0 ? `\n- ... y ${hiddenOthers} producto(s) más` : ''}`;
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `📊 Ventas (${periodLabel})\n\n` +
                            `🔢 Cantidad vendida: ${summary.totalUnits} unidades\n` +
                            `${topProductLine}\n` +
                            `${otherProductsLine}\n` +
                            `💰 Ventas en dinero: ${formatCurrency(summary.totalSalesMoney)}`,
                    });
                    return res.status(200).json({ ok: true });
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : 'Error interno consultando ventas';
                    await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No pude calcular las ventas: ${message}` });
                    return res.status(200).json({ ok: true });
                }
            }
            if (textForCommand && isCustomerLookupCommand(textForCommand)) {
                const user = await dependencies_1.userRepository.findByTelegramId(chatId);
                if (!user) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `No tienes un usuario asignado. Envia este ID a soporte: ${chatId}`,
                    });
                    return res.status(200).json({ ok: true });
                }
                const name = parseCustomerLookupName(textForCommand);
                if (!name) {
                    await telegramClient_1.TelegramClient.sendMessage({ chatId, text: 'Indica el nombre del cliente. Ejemplo: "consultar cliente Juan Perez".' });
                    return res.status(200).json({ ok: true });
                }
                await sendCustomerLookup(chatId, user.companyId, name);
                return res.status(200).json({ ok: true });
            }
            if (rawText) {
                const parsedCustomer = parseCustomerCreateMessage(rawText);
                if (parsedCustomer) {
                    const user = await dependencies_1.userRepository.findByTelegramId(chatId);
                    if (!user) {
                        await telegramClient_1.TelegramClient.sendMessage({
                            chatId,
                            text: `No tienes un usuario asignado. Envia este ID a soporte: ${chatId}`,
                        });
                        return res.status(200).json({ ok: true });
                    }
                    if (parsedCustomer.name &&
                        parsedCustomer.documentNumber &&
                        isValidCustomerDocument(parsedCustomer.documentNumber) &&
                        parsedCustomer.phone &&
                        isValidCustomerPhone(parsedCustomer.phone)) {
                        await createCustomerFromInput(chatId, user.companyId, parsedCustomer);
                        return res.status(200).json({ ok: true });
                    }
                    await startGuidedCustomer(chatId, user.companyId, parsedCustomer);
                    return res.status(200).json({ ok: true });
                }
            }
            if (isProductListCommand(textForCommand)) {
                const user = await dependencies_1.userRepository.findByTelegramId(chatId);
                if (!user) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `No tienes un usuario asignado. Envia este ID a soporte: ${chatId}`,
                    });
                    return res.status(200).json({ ok: true });
                }
                await sendProductListMessage(chatId, user.companyId);
                return res.status(200).json({ ok: true });
            }
            if (isFastSaleCommand(textForCommand)) {
                const user = await dependencies_1.userRepository.findByTelegramId(chatId);
                if (!user) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `No tienes un usuario asignado. Envia este ID a soporte: ${chatId}`,
                    });
                    return res.status(200).json({ ok: true });
                }
                await startFastSaleFromText(chatId, user.companyId, textForCommand, { allowGuidedFallback: true });
                return res.status(200).json({ ok: true });
            }
            if (isGuidedSaleCommand(textForCommand)) {
                const user = await dependencies_1.userRepository.findByTelegramId(chatId);
                if (!user) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `No tienes un usuario asignado. Envia este ID a soporte: ${chatId}`,
                    });
                    return res.status(200).json({ ok: true });
                }
                await startGuidedSale(chatId, user.companyId);
                return res.status(200).json({ ok: true });
            }
            if (isGuidedCustomerCommand(textForCommand)) {
                const user = await dependencies_1.userRepository.findByTelegramId(chatId);
                if (!user) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `No tienes un usuario asignado. Envia este ID a soporte: ${chatId}`,
                    });
                    return res.status(200).json({ ok: true });
                }
                await startGuidedCustomer(chatId, user.companyId);
                return res.status(200).json({ ok: true });
            }
            if (isGuidedInvoiceIssuerCommand(textForCommand)) {
                const user = await dependencies_1.userRepository.findByTelegramId(chatId);
                if (!user) {
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `No tienes un usuario asignado. Envia este ID a soporte: ${chatId}`,
                    });
                    return res.status(200).json({ ok: true });
                }
                await startGuidedInvoiceIssuer(chatId, user.companyId);
                return res.status(200).json({ ok: true });
            }
        }
        if (rawText && isGreetingOrHelp(rawText)) {
            if (!ensureChatId(chatId, res))
                return;
            const userName = (await dependencies_1.userRepository.findByTelegramId(chatId))?.name;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: formatHelpMessage(userName),
                parseMode: 'Markdown',
            });
            return res.status(200).json({ ok: true });
        }
        const detected = await telegramAdapter_1.TelegramAdapter.detectAndParse(update, {
            userRepository: dependencies_1.userRepository,
        }, rawText ?? undefined);
        if (!detected)
            return res.status(200).json({ ok: true });
        // -----------------------------------------------------------------
        // VENTA
        // -----------------------------------------------------------------
        if (detected.type === 'sale') {
            try {
                if (!ensureChatId(chatId, res))
                    return;
                const saleInput = detected.data;
                if (!saleInput.companyId)
                    throw new Error('Empresa no definida');
                if (!saleInput.unitPrice && !saleInput.totalAmount && rawText) {
                    const fallbackAmount = extractLargestMoney(rawText);
                    if (fallbackAmount) {
                        const isTotal = /\b(total|todos|todo)\b/.test(normalizeText(rawText));
                        if (isTotal)
                            saleInput.totalAmount = fallbackAmount;
                        else
                            saleInput.unitPrice = fallbackAmount;
                    }
                }
                if (rawText) {
                    const started = await startFastSaleFromText(chatId, saleInput.companyId, rawText, {
                        silentFail: true,
                        allowGuidedFallback: true,
                    });
                    if (started)
                        return res.status(200).json({ ok: true });
                }
                const description = saleInput.description ?? '';
                const productGuess = description.replace(/venta\s+de\s+\d+\s+/i, '').trim() || null;
                await startGuidedSaleWithPrefill(chatId, saleInput, productGuess);
                return res.status(200).json({ ok: true });
            }
            catch (err) {
                if (!ensureChatId(chatId, res))
                    return;
                const message = err instanceof Error ? err.message : 'Error interno preparando la venta';
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No pude preparar la venta: ${message}` });
                return res.status(200).json({ ok: true });
            }
        }
        // -----------------------------------------------------------------
        // COMPRA
        // -----------------------------------------------------------------
        if (detected.type === 'purchase') {
            try {
                if (!ensureChatId(chatId, res))
                    return;
                const purchaseInput = detected.data;
                if (!purchaseInput.companyId)
                    throw new Error('Empresa no definida');
                await createPendingEvent({
                    chatId,
                    companyId: purchaseInput.companyId,
                    eventType: 'purchase',
                    interpretedData: purchaseInput,
                    supplierName: purchaseInput.supplier ?? null,
                });
                return res.status(200).json({ ok: true });
            }
            catch (err) {
                if (!ensureChatId(chatId, res))
                    return;
                const message = err instanceof Error ? err.message : 'Error interno preparando la compra';
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No pude preparar la compra: ${message}` });
                return res.status(200).json({ ok: true });
            }
        }
        // -----------------------------------------------------------------
        // PAYROLL
        // -----------------------------------------------------------------
        if (detected.type === 'payroll') {
            try {
                if (!ensureChatId(chatId, res))
                    return;
                const payrollInput = detected.data;
                if (!payrollInput.companyId)
                    throw new Error('Empresa no definida');
                await createPendingEvent({
                    chatId,
                    companyId: payrollInput.companyId,
                    eventType: 'payroll',
                    interpretedData: payrollInput,
                });
                return res.status(200).json({ ok: true });
            }
            catch (err) {
                if (!ensureChatId(chatId, res))
                    return;
                const message = err instanceof Error ? err.message : 'Error interno preparando la nomina';
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No pude preparar la nomina: ${message}` });
                return res.status(200).json({ ok: true });
            }
        }
        // -----------------------------------------------------------------
        // PAGO DE CLIENTE
        // -----------------------------------------------------------------
        if (detected.type === 'customer_payment') {
            try {
                if (!ensureChatId(chatId, res))
                    return;
                const paymentInput = detected.data;
                if (!paymentInput.companyId)
                    throw new Error('Empresa no definida');
                if (!paymentInput.customerName?.trim())
                    throw new Error('Debes indicar el nombre del cliente');
                const amount = Number(paymentInput.amount ?? 0);
                if (!Number.isFinite(amount) || amount <= 0)
                    throw new Error('Monto invalido');
                await createPendingEvent({
                    chatId,
                    companyId: paymentInput.companyId,
                    eventType: 'customer_payment',
                    interpretedData: paymentInput,
                    customerName: paymentInput.customerName ?? null,
                });
                return res.status(200).json({ ok: true });
            }
            catch (err) {
                if (!ensureChatId(chatId, res))
                    return;
                const message = err instanceof Error ? err.message : 'Error interno preparando el pago';
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No pude preparar el pago: ${message}` });
                return res.status(200).json({ ok: true });
            }
        }
        // -----------------------------------------------------------------
        // PAGO A PROVEEDOR
        // -----------------------------------------------------------------
        if (detected.type === 'supplier_payment') {
            try {
                if (!ensureChatId(chatId, res))
                    return;
                const paymentInput = detected.data;
                if (!paymentInput.companyId)
                    throw new Error('Empresa no definida');
                if (!paymentInput.supplierName?.trim())
                    throw new Error('Debes indicar el nombre del proveedor');
                const amount = Number(paymentInput.amount ?? 0);
                if (!Number.isFinite(amount) || amount <= 0)
                    throw new Error('Monto invalido');
                await createPendingEvent({
                    chatId,
                    companyId: paymentInput.companyId,
                    eventType: 'supplier_payment',
                    interpretedData: paymentInput,
                    supplierName: paymentInput.supplierName ?? null,
                });
                return res.status(200).json({ ok: true });
            }
            catch (err) {
                if (!ensureChatId(chatId, res))
                    return;
                const message = err instanceof Error ? err.message : 'Error interno preparando el pago';
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No pude preparar el pago: ${message}` });
                return res.status(200).json({ ok: true });
            }
        }
        if (detected.type === 'ar_query') {
            try {
                const queryInput = detected.data;
                if (!queryInput.companyId)
                    throw new Error('Empresa no definida');
                const arEnabled = await isAccountsReceivableEnabled(queryInput.companyId);
                if (!arEnabled && queryInput.queryType !== 'customer_statement') {
                    if (!ensureChatId(chatId, res))
                        return;
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: 'Cuentas por cobrar no esta activado para tu empresa.',
                    });
                    return res.status(200).json({ ok: true });
                }
                if (queryInput.queryType === 'list_debtors') {
                    const items = await listCustomersWithBalance({ companyId: queryInput.companyId });
                    const filtered = items.filter((item) => item.balance > 0);
                    if (filtered.length === 0) {
                        if (!ensureChatId(chatId, res))
                            return;
                        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: '✅ ¡Excelente! No tienes clientes con saldo pendiente.' });
                        return res.status(200).json({ ok: true });
                    }
                    const lines = filtered.map((item) => `💳 ${item.customer.name}: ${formatCurrency(item.balance)}`).join('\n');
                    const totalDebt = filtered.reduce((sum, item) => sum + item.balance, 0);
                    if (!ensureChatId(chatId, res))
                        return;
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `📊 *Clientes con saldo pendiente:*\n\n${lines}\n\n💰 *Total adeudado:* ${formatCurrency(totalDebt)}`,
                        parseMode: 'Markdown',
                    });
                    return res.status(200).json({ ok: true });
                }
                if (queryInput.queryType === 'customer_balance') {
                    if (!queryInput.customerName)
                        throw new Error('Debes indicar el nombre del cliente');
                    const result = await getCustomerBalance({ companyId: queryInput.companyId, customerName: queryInput.customerName });
                    if (!result) {
                        if (!ensureChatId(chatId, res))
                            return;
                        await telegramClient_1.TelegramClient.sendMessage({
                            chatId,
                            text: `âŒ No encontre al cliente *${queryInput.customerName}*.`,
                            parseMode: 'Markdown',
                        });
                        return res.status(200).json({ ok: true });
                    }
                    if (!ensureChatId(chatId, res))
                        return;
                    const statusIcon = result.balance > 0 ? '💳' : '✅';
                    const message = result.balance > 0 ? `${statusIcon} *${result.customer.name}* debe:\n*${formatCurrency(result.balance)}*` : `${statusIcon} *${result.customer.name}* está al día ✓`;
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: message,
                        parseMode: 'Markdown',
                    });
                    return res.status(200).json({ ok: true });
                }
                if (queryInput.queryType === 'customer_statement') {
                    if (!queryInput.customerName)
                        throw new Error('Debes indicar el nombre del cliente');
                    const result = await getCustomerStatement({ companyId: queryInput.companyId, customerName: queryInput.customerName });
                    if (!result) {
                        if (!ensureChatId(chatId, res))
                            return;
                        await telegramClient_1.TelegramClient.sendMessage({
                            chatId,
                            text: `❌ No encontre al cliente *${queryInput.customerName}*.`,
                            parseMode: 'Markdown',
                        });
                        return res.status(200).json({ ok: true });
                    }
                    const lines = result.entries.map((entry) => {
                        const typeIcon = entry.type === 'sale' ? '📈' : '💰';
                        const typeLabel = entry.type === 'sale' ? 'Venta' : 'Pago';
                        return `${typeIcon} ${formatDate(entry.date)} - ${typeLabel}: ${formatCurrency(entry.amount)}`;
                    });
                    if (!ensureChatId(chatId, res))
                        return;
                    const statusIcon = result.balance > 0 ? '💳' : '✅';
                    const balanceLine = result.balance > 0 ? `\n*${statusIcon} Saldo pendiente:* ${formatCurrency(result.balance)}` : `\n*${statusIcon} Cuenta al día* ✓`;
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `📋 *Extracto de ${result.customer.name}*\n${lines.join('\n')}${balanceLine}`,
                        parseMode: 'Markdown',
                    });
                    return res.status(200).json({ ok: true });
                }
                throw new Error('Consulta no reconocida');
            }
            catch (err) {
                if (!ensureChatId(chatId, res))
                    return;
                const message = err instanceof Error ? err.message : 'Error interno consultando cuentas por cobrar';
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No pude responder la consulta: ${message}` });
                return res.status(200).json({ ok: true });
            }
        }
        if (detected.type === 'ap_query') {
            try {
                const queryInput = detected.data;
                if (!queryInput.companyId)
                    throw new Error('Empresa no definida');
                const apEnabled = await isAccountsPayableEnabled(queryInput.companyId);
                if (!apEnabled && queryInput.queryType !== 'supplier_statement') {
                    if (!ensureChatId(chatId, res))
                        return;
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: 'Cuentas por pagar no esta activado para tu empresa.',
                    });
                    return res.status(200).json({ ok: true });
                }
                if (queryInput.queryType === 'list_creditors') {
                    const items = await listSuppliersWithBalance({ companyId: queryInput.companyId });
                    const filtered = items.filter((item) => item.balance > 0);
                    if (filtered.length === 0) {
                        if (!ensureChatId(chatId, res))
                            return;
                        await telegramClient_1.TelegramClient.sendMessage({ chatId, text: '✅ ¡Excelente! No tienes proveedores con saldo pendiente.' });
                        return res.status(200).json({ ok: true });
                    }
                    const lines = filtered.map((item) => `💳 ${item.supplier.name}: ${formatCurrency(item.balance)}`).join('\n');
                    const totalDebt = filtered.reduce((sum, item) => sum + item.balance, 0);
                    if (!ensureChatId(chatId, res))
                        return;
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `📊 *Proveedores con saldo pendiente:*\n\n${lines}\n\n💰 *Total adeudado:* ${formatCurrency(totalDebt)}`,
                        parseMode: 'Markdown',
                    });
                    return res.status(200).json({ ok: true });
                }
                if (queryInput.queryType === 'supplier_balance') {
                    if (!queryInput.supplierName)
                        throw new Error('Debes indicar el nombre del proveedor');
                    const result = await getSupplierBalance({ companyId: queryInput.companyId, supplierName: queryInput.supplierName });
                    if (!result) {
                        if (!ensureChatId(chatId, res))
                            return;
                        await telegramClient_1.TelegramClient.sendMessage({
                            chatId,
                            text: `âŒ No encontre al proveedor *${queryInput.supplierName}*.`,
                            parseMode: 'Markdown',
                        });
                        return res.status(200).json({ ok: true });
                    }
                    if (!ensureChatId(chatId, res))
                        return;
                    const statusIcon = result.balance > 0 ? '💳' : '✅';
                    const message = result.balance > 0 ? `${statusIcon} *${result.supplier.name}* tiene saldo pendiente:\n*${formatCurrency(result.balance)}*` : `${statusIcon} *${result.supplier.name}* está al día ✓`;
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: message,
                        parseMode: 'Markdown',
                    });
                    return res.status(200).json({ ok: true });
                }
                if (queryInput.queryType === 'supplier_statement') {
                    if (!queryInput.supplierName)
                        throw new Error('Debes indicar el nombre del proveedor');
                    const result = await getSupplierStatement({ companyId: queryInput.companyId, supplierName: queryInput.supplierName });
                    if (!result) {
                        if (!ensureChatId(chatId, res))
                            return;
                        await telegramClient_1.TelegramClient.sendMessage({
                            chatId,
                            text: `❌ No encontre al proveedor *${queryInput.supplierName}*.`,
                            parseMode: 'Markdown',
                        });
                        return res.status(200).json({ ok: true });
                    }
                    const lines = result.entries.map((entry) => {
                        const typeIcon = entry.type === 'purchase' ? '📉' : '💰';
                        const typeLabel = entry.type === 'purchase' ? 'Compra' : 'Pago';
                        return `${typeIcon} ${formatDate(entry.date)} - ${typeLabel}: ${formatCurrency(entry.amount)}`;
                    });
                    if (!ensureChatId(chatId, res))
                        return;
                    const statusIcon = result.balance > 0 ? '💳' : '✅';
                    const balanceLine = result.balance > 0 ? `\n*${statusIcon} Saldo pendiente:* ${formatCurrency(result.balance)}` : `\n*${statusIcon} Cuenta al día* ✓`;
                    await telegramClient_1.TelegramClient.sendMessage({
                        chatId,
                        text: `📋 *Extracto de ${result.supplier.name}*\n${lines.join('\n')}${balanceLine}`,
                        parseMode: 'Markdown',
                    });
                    return res.status(200).json({ ok: true });
                }
                throw new Error('Consulta no reconocida');
            }
            catch (err) {
                if (!ensureChatId(chatId, res))
                    return;
                const message = err instanceof Error ? err.message : 'Error interno consultando cuentas por pagar';
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No pude responder la consulta: ${message}` });
                return res.status(200).json({ ok: true });
            }
        }
        if (detected.type === 'income_statement_query') {
            try {
                const { period, companyId } = detected;
                if (!period)
                    throw new Error('Periodo no definido');
                const result = await generateIncomeStatement(companyId, { start: period.start, end: period.end });
                const net = result.totals.incomeBeforeTaxes;
                const verb = net >= 0 ? 'Ganaste' : 'Perdiste';
                const amount = formatCurrency(Math.abs(net));
                if (!ensureChatId(chatId, res))
                    return;
                await telegramClient_1.TelegramClient.sendMessage({
                    chatId,
                    text: `${verb} ${amount} entre ${period.start} y ${period.end}`,
                    parseMode: 'Markdown',
                });
                return res.status(200).json({ ok: true });
            }
            catch (err) {
                if (!ensureChatId(chatId, res))
                    return;
                const message = err instanceof Error ? err.message : 'No pude calcular la utilidad';
                await telegramClient_1.TelegramClient.sendMessage({ chatId, text: `No pude calcular la utilidad: ${message}` });
                return res.status(200).json({ ok: true });
            }
        }
        if (detected.type === 'income_statement_error') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'No pude entender el periodo. Dime: "cuánto gané hoy", "esta semana", "este mes" o "este año".',
            });
            return res.status(200).json({ ok: true });
        }
        if (detected.type === 'customer_payment_error') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'No pude entender el pago del cliente. Ejemplo: "Alfredo Celis me pago 400000 en efectivo".',
            });
            return res.status(200).json({ ok: true });
        }
        if (detected.type === 'supplier_payment_error') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'No pude entender el pago al proveedor. Ejemplo: "Pague 400000 a Textiles Andinos en efectivo".',
            });
            return res.status(200).json({ ok: true });
        }
        if (detected.type === 'ar_query_error') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'No pude entender la consulta. Ejemplos: "quien me debe", "cuanto me debe Alfredo", "extracto de Alfredo".',
            });
            return res.status(200).json({ ok: true });
        }
        if (detected.type === 'ap_query_error') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'No pude entender la consulta. Ejemplos: "a quien le debo", "cuanto le debo a Textiles Andinos", "extracto de Textiles Andinos".',
            });
            return res.status(200).json({ ok: true });
        }
        // -----------------------------------------------------------------
        // ERRORES DE PARSEO
        // -----------------------------------------------------------------
        if (detected.type === 'sale_error') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `
No logre entender la venta.
Debes indicar cantidad, producto, precio, costo y si incluye IVA.
        `.trim(),
                parseMode: 'Markdown',
            });
            return res.status(200).json({ ok: true });
        }
        if (detected.type === 'purchase_error') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `
No logre entender la compra.
Ejemplo: "Compre tela por 700.000 sin IVA, pagado por banco, es insumo".
        `.trim(),
                parseMode: 'Markdown',
            });
            return res.status(200).json({ ok: true });
        }
        if (detected.type === 'payroll_error') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `
No logre entender el pago de nomina.
Ejemplos:
- pague nomina 500000 por banco
- pague empleados 700000 en efectivo
        `.trim(),
                parseMode: 'Markdown',
            });
            return res.status(200).json({ ok: true });
        }
        // -----------------------------------------------------------------
        // MENSAJE NO CLASIFICADO
        // -----------------------------------------------------------------
        if (detected.type === 'unknown') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `
No reconozco si tu mensaje es venta, compra, pago de nomina o pago de cliente.

💵 *Venta:*
"Vendi 10 pantalones a 50.000 me cuesta 36.000"
y si es necesario un cliente puedes agregar:
"Vendi 10 pantalones a 50.000 me cuesta 36.000 a Alfredo Celis"

📦 *Compra:*
"Compre cremalleras por 300.000 sin IVA en efectivo"

👥 *Nómina:*
"pague nomina 500000 por banco"

💰 *Pago de cliente:*
"Alfredo Celis me pago 400000 en efectivo"
        `.trim(),
                parseMode: 'Markdown',
            });
        }
        return res.status(200).json({ ok: true });
    }
    catch (error) {
        console.error('Error manejando webhook:', error);
        if (ensureChatId(chatId, res)) {
            telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: 'Error interno procesando tu mensaje.',
            });
        }
        return res.status(200).json({ ok: true });
    }
});
