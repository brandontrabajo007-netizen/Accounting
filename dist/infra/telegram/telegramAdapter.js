"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramAdapter = void 0;
const aiArPaymentParser_1 = require("@application/parsers/aiArPaymentParser");
const aiApPaymentParser_1 = require("@application/parsers/aiApPaymentParser");
const aiArQueryParser_1 = require("@application/parsers/aiArQueryParser");
const aiApQueryParser_1 = require("@application/parsers/aiApQueryParser");
const aiEventClassifier_1 = require("@application/parsers/aiEventClassifier");
const aiParsePurchase_1 = require("@application/parsers/aiParsePurchase");
const aiPayrollParser_1 = require("@application/parsers/aiPayrollParser");
const aiSaleParser_1 = require("@application/parsers/aiSaleParser");
const telegramClient_1 = require("./telegramClient");
// Normaliza fecha/periodo cuando el usuario no menciona año: asume el año actual
const applyCurrentYearIfMissing = (rawText, input) => {
    const yearMentioned = /\b20\d{2}\b/.test(rawText);
    if (yearMentioned)
        return;
    const currentYear = new Date().getUTCFullYear();
    if (input.date) {
        const d = new Date(input.date);
        if (!Number.isNaN(d.getTime())) {
            d.setUTCFullYear(currentYear);
            input.date = d.toISOString();
        }
    }
    if (input.periodHint) {
        const match = input.periodHint.match(/^\d{4}-(\d{2})$/);
        if (match) {
            input.periodHint = `${currentYear}-${match[1]}`;
        }
    }
};
const bogotaFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});
const getBogotaTodayUtc = () => {
    const parts = bogotaFormatter.format(new Date()).split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
};
const toDateString = (d) => d.toISOString().slice(0, 10);
const monthNames = {
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
const parseSpanishDate = (raw) => {
    // Ej: "22 de diciembre", "22 de diciembre de 2024", "2024-12-22"
    const isoMatch = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (isoMatch) {
        const [_, y, m, d] = isoMatch;
        const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
        return Number.isNaN(date.getTime()) ? null : date;
    }
    const dmMatch = raw.match(/(\d{1,2})\s+de\s+([a-zA-Záéíóúñ]+)(?:\s+de\s+(\d{4}))?/i);
    if (!dmMatch)
        return null;
    const day = Number(dmMatch[1]);
    const monthName = dmMatch[2].toLowerCase();
    const year = dmMatch[3] ? Number(dmMatch[3]) : getBogotaTodayUtc().getUTCFullYear();
    const month = monthNames[monthName];
    if (month === undefined)
        return null;
    const date = new Date(Date.UTC(year, month, day));
    return Number.isNaN(date.getTime()) ? null : date;
};
const parseNumericDate = (raw) => {
    const match = raw.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?\b/);
    if (!match)
        return null;
    const year = match[3] ? Number(match[3]) : getBogotaTodayUtc().getUTCFullYear();
    const date = new Date(Date.UTC(year, Number(match[2]) - 1, Number(match[1])));
    return Number.isNaN(date.getTime()) ? null : date;
};
const parsePaymentDateFromText = (rawText) => {
    const text = rawText.toLowerCase();
    const today = getBogotaTodayUtc();
    if (/\bhoy\b/.test(text))
        return toDateString(today);
    if (/\bayer\b|\banoche\b/.test(text)) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - 1);
        return toDateString(d);
    }
    if (/\bmanana\b|\bma\u00f1ana\b/.test(text)) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() + 1);
        return toDateString(d);
    }
    const explicitDateMatch = text.match(/\b(?:el\s+)?(?:(?:dia|d\u00eda)\s+)?(\d{1,2}\s+de\s+[a-zA-ZÃ¡Ã©Ã­Ã³ÃºÃ±]+(?:\s+de\s+\d{4})?|\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{4})?)\b/);
    if (explicitDateMatch) {
        const date = parseSpanishDate(explicitDateMatch[1]) ?? parseNumericDate(explicitDateMatch[1]);
        if (date)
            return toDateString(date);
    }
    return toDateString(today);
};
const toPositiveInt = (value) => {
    const raw = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : NaN;
    if (!Number.isFinite(raw))
        return null;
    const rounded = Math.round(raw);
    return rounded > 0 ? rounded : null;
};
const extractExplicitSaleQuantity = (rawText) => {
    const patterns = [
        /(?:^|\b)venta(?:s)?\s+de\s+(\d{1,6})(?:\b|$)/i,
        /(?:^|\b)vend(?:i|í|imos|ieron|io|ió)\s+(\d{1,6})(?:\b|$)/i,
        /(?:^|\b)se\s+vend(?:io|ió|ieron)\s+(\d{1,6})(?:\b|$)/i,
        /^\s*(\d{1,6})(?=\s+[^\d])/i,
    ];
    for (const pattern of patterns) {
        const match = rawText.match(pattern);
        const qty = toPositiveInt(match?.[1]);
        if (qty)
            return qty;
    }
    return null;
};
const extractPackSizeHint = (rawText) => {
    const packMatch = rawText.match(/(?:^|[\s(])x\s*(\d{1,3})(?=\b|[^\d])/i);
    const packSize = toPositiveInt(packMatch?.[1]);
    if (packSize && packSize > 1)
        return packSize;
    if (/\bdocenas?\b/i.test(rawText))
        return 12;
    return null;
};
const normalizeParsedSaleQuantity = (rawText, parsedQty) => {
    const explicitQty = extractExplicitSaleQuantity(rawText);
    const normalizedParsedQty = toPositiveInt(parsedQty);
    if (!normalizedParsedQty)
        return explicitQty ?? undefined;
    const packSize = extractPackSizeHint(rawText);
    if (!explicitQty || !packSize)
        return normalizedParsedQty;
    if (normalizedParsedQty === explicitQty * packSize) {
        return explicitQty;
    }
    return normalizedParsedQty;
};
exports.TelegramAdapter = {
    async getMessageText(message) {
        if (!message)
            return null;
        const directText = message.text?.trim() ?? null;
        const voice = message.voice ?? message.audio;
        if (directText)
            return directText;
        if (voice) {
            try {
                const file = await telegramClient_1.TelegramClient.getFileDownloadUrl(voice.file_id);
                const transcript = await telegramClient_1.TelegramClient.transcribeAudio(file);
                if (!transcript)
                    return null;
                return transcript.trim();
            }
            catch {
                return null;
            }
        }
        return null;
    },
    parseIncomeStatementPeriod(text) {
        const lower = text.toLowerCase();
        // Rango explicito: "del 22 de diciembre al 28 de diciembre" o "2024-12-22 al 2024-12-28"
        const rangeMatch = lower.match(/del\s+(.+?)\s+al\s+(.+)/i);
        if (rangeMatch) {
            const fromText = rangeMatch[1];
            const toText = rangeMatch[2];
            const startDate = parseSpanishDate(fromText);
            const endDate = parseSpanishDate(toText);
            if (startDate && endDate) {
                return { start: toDateString(startDate), end: toDateString(endDate) };
            }
        }
        // Día específico: "día 24 de diciembre", "el 2025-12-24"
        const singleDayMatch = lower.match(/(?:^|\b)(?:el\s+|d[ií]a\s+)?(\d{1,2}\s+de\s+[a-záéíóúñ]+(?:\s+de\s+\d{4})?|\d{4}-\d{2}-\d{2})/);
        if (singleDayMatch) {
            const date = parseSpanishDate(singleDayMatch[1]);
            if (date)
                return { start: toDateString(date), end: toDateString(date) };
        }
        // Mes específico: "mes de enero", "el mes de febrero", "en febrero", "enero 2025"
        const monthMatch = lower.match(/(?:el\s+)?mes\s+de\s+([a-záéíóúñ]+)(?:\s+de\s+(\d{4}))?/) || lower.match(/\ben\s+([a-záéíóúñ]+)(?:\s+(\d{4}))?\b/) || lower.match(/\b([a-záéíóúñ]+)\s+(\d{4})?\s*$/);
        if (monthMatch) {
            const name = (monthMatch[1] ?? '').toLowerCase();
            const month = monthNames[name];
            if (month !== undefined) {
                const year = monthMatch[2] ? Number(monthMatch[2]) : getBogotaTodayUtc().getUTCFullYear();
                const start = new Date(Date.UTC(year, month, 1));
                const end = new Date(Date.UTC(year, month + 1, 0)); // último día del mes
                return { start: toDateString(start), end: toDateString(end) };
            }
        }
        if (lower.includes('hoy')) {
            const d = getBogotaTodayUtc();
            return { start: toDateString(d), end: toDateString(d) };
        }
        if (lower.includes('esta semana') || lower.includes('semana actual')) {
            const today = getBogotaTodayUtc();
            const day = today.getUTCDay() === 0 ? 7 : today.getUTCDay(); // domingo=7
            const start = new Date(today);
            start.setUTCDate(today.getUTCDate() - (day - 1)); // lunes
            return { start: toDateString(start), end: toDateString(today) };
        }
        if (lower.includes('semana pasada')) {
            const today = getBogotaTodayUtc();
            const day = today.getUTCDay() === 0 ? 7 : today.getUTCDay();
            const startCurrentWeek = new Date(today);
            startCurrentWeek.setUTCDate(today.getUTCDate() - (day - 1)); // lunes actual
            const start = new Date(startCurrentWeek);
            start.setUTCDate(startCurrentWeek.getUTCDate() - 7);
            const end = new Date(start);
            end.setUTCDate(start.getUTCDate() + 6);
            return { start: toDateString(start), end: toDateString(end) };
        }
        if (lower.includes('este mes') || lower.includes('mes actual')) {
            const today = getBogotaTodayUtc();
            const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
            const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)); // último día del mes
            return { start: toDateString(start), end: toDateString(end) };
        }
        if (/\beste\s+a(?:\u00f1|n)o\b/.test(lower) || /\ba(?:\u00f1|n)o\s+actual\b/.test(lower)) {
            const year = getBogotaTodayUtc().getUTCFullYear();
            const start = new Date(Date.UTC(year, 0, 1));
            const end = new Date(Date.UTC(year, 11, 31));
            return { start: toDateString(start), end: toDateString(end) };
        }
        return null;
    },
    // ---------------------------------------------------------------------
    // ✅ 1. PARSE SALE
    // ---------------------------------------------------------------------
    async toSaleInput(update, deps, rawText) {
        const message = update.message;
        if (!message)
            return null;
        const chatId = message.chat.id;
        const user = await deps.userRepository.findByTelegramId(chatId);
        if (!user)
            return null;
        const text = rawText ?? (await this.getMessageText(message));
        if (!text)
            return null;
        const sale = await (0, aiSaleParser_1.aiParseSale)(text);
        if (!sale)
            return null;
        const normalizedQty = normalizeParsedSaleQuantity(text, sale.quantity);
        if (typeof normalizedQty === 'number') {
            sale.quantity = normalizedQty;
            if (typeof sale.description === 'string') {
                sale.description = sale.description.replace(/^(\s*venta\s+de\s+)\d+\b/i, `$1${normalizedQty}`);
            }
        }
        applyCurrentYearIfMissing(text, sale);
        sale.companyId = user.companyId;
        return { chatId, saleInput: sale };
    },
    // ---------------------------------------------------------------------
    // ✅ 2. PARSE PURCHASE
    // ---------------------------------------------------------------------
    async toPurchaseInput(update, deps, rawText) {
        const message = update.message;
        if (!message)
            return null;
        const chatId = message.chat.id;
        const user = await deps.userRepository.findByTelegramId(chatId);
        if (!user)
            return null;
        const text = rawText ?? (await this.getMessageText(message));
        if (!text)
            return null;
        const purchase = await (0, aiParsePurchase_1.aiParsePurchase)(text);
        if (!purchase)
            return null;
        applyCurrentYearIfMissing(text, purchase);
        purchase.companyId = user.companyId;
        return { chatId, purchaseInput: purchase };
    },
    // ---------------------------------------------------------------------
    // ✅ 3. PARSE PAYROLL (SOLO EMPLEADOS)
    // ---------------------------------------------------------------------
    async toPayrollInput(update, deps, rawText) {
        const message = update.message;
        if (!message)
            return null;
        const chatId = message.chat.id;
        const user = await deps.userRepository.findByTelegramId(chatId);
        if (!user)
            return null;
        const text = rawText ?? (await this.getMessageText(message));
        if (!text)
            return null;
        const payroll = await (0, aiPayrollParser_1.aiParsePayroll)(text);
        if (!payroll)
            return null; // IA descarta talleres/tintorerías/etc.
        applyCurrentYearIfMissing(text, payroll);
        payroll.companyId = user.companyId;
        return { chatId, payrollInput: payroll };
    },
    // ---------------------------------------------------------------------
    // ƒo. 4. PARSE CUSTOMER PAYMENT
    // ---------------------------------------------------------------------
    async toArPaymentInput(update, deps, rawText) {
        const message = update.message;
        if (!message)
            return null;
        const chatId = message.chat.id;
        const user = await deps.userRepository.findByTelegramId(chatId);
        if (!user)
            return null;
        const text = rawText ?? (await this.getMessageText(message));
        if (!text)
            return null;
        const payment = await (0, aiArPaymentParser_1.aiParseArPayment)(text);
        if (!payment)
            return null;
        applyCurrentYearIfMissing(text, payment);
        payment.date = parsePaymentDateFromText(text);
        payment.companyId = user.companyId;
        return { chatId, paymentInput: payment };
    },
    // ---------------------------------------------------------------------
    // ’'o. 5. PARSE SUPPLIER PAYMENT
    // ---------------------------------------------------------------------
    async toApPaymentInput(update, deps, rawText) {
        const message = update.message;
        if (!message)
            return null;
        const chatId = message.chat.id;
        const user = await deps.userRepository.findByTelegramId(chatId);
        if (!user)
            return null;
        const text = rawText ?? (await this.getMessageText(message));
        if (!text)
            return null;
        const payment = await (0, aiApPaymentParser_1.aiParseApPayment)(text);
        if (!payment)
            return null;
        applyCurrentYearIfMissing(text, payment);
        payment.date = parsePaymentDateFromText(text);
        payment.companyId = user.companyId;
        return { chatId, paymentInput: payment };
    },
    // ---------------------------------------------------------------------
    // ƒo. 5. PARSE AR QUERY
    // ---------------------------------------------------------------------
    async toArQueryInput(update, deps, rawText) {
        const message = update.message;
        if (!message)
            return null;
        const chatId = message.chat.id;
        const user = await deps.userRepository.findByTelegramId(chatId);
        if (!user)
            return null;
        const text = rawText ?? (await this.getMessageText(message));
        if (!text)
            return null;
        const query = await (0, aiArQueryParser_1.aiParseArQuery)(text);
        if (!query)
            return null;
        query.companyId = user.companyId;
        return { chatId, queryInput: query };
    },
    // ---------------------------------------------------------------------
    // ’'o. 6. PARSE AP QUERY
    // ---------------------------------------------------------------------
    async toApQueryInput(update, deps, rawText) {
        const message = update.message;
        if (!message)
            return null;
        const chatId = message.chat.id;
        const user = await deps.userRepository.findByTelegramId(chatId);
        if (!user)
            return null;
        const text = rawText ?? (await this.getMessageText(message));
        if (!text)
            return null;
        const query = await (0, aiApQueryParser_1.aiParseApQuery)(text);
        if (!query)
            return null;
        query.companyId = user.companyId;
        return { chatId, queryInput: query };
    },
    // ---------------------------------------------------------------------
    // ✅ 4. DETECTOR DE EVENTO (sale | purchase | payroll | income | unknown)
    // ---------------------------------------------------------------------
    async detectAndParse(update, deps, rawText) {
        const message = update.message;
        const chatId = message?.chat?.id;
        if (!message || !chatId)
            return null;
        const user = await deps.userRepository.findByTelegramId(chatId);
        if (!user) {
            console.warn(`[Telegram] chatId sin usuario asignado: ${chatId}`);
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `No tienes un usuario asignado. Envia este ID a soporte: ${chatId}`,
            });
            return null;
        }
        const text = rawText ?? (await this.getMessageText(message));
        if (!text)
            return null;
        const classification = await (0, aiEventClassifier_1.aiClassifyEvent)(text);
        console.log('📊 Clasificación IA:', classification);
        // --- SALE ---
        if (classification === 'sale') {
            const result = await this.toSaleInput(update, deps, text);
            if (!result)
                return { type: 'sale_error', chatId };
            return { type: 'sale', chatId, data: result.saleInput };
        }
        // --- PURCHASE ---
        if (classification === 'purchase') {
            const result = await this.toPurchaseInput(update, deps, text);
            if (!result)
                return { type: 'purchase_error', chatId };
            return { type: 'purchase', chatId, data: result.purchaseInput };
        }
        // --- PAYROLL ---
        if (classification === 'payroll') {
            const result = await this.toPayrollInput(update, deps, text);
            if (!result)
                return { type: 'payroll_error', chatId };
            return { type: 'payroll', chatId, data: result.payrollInput };
        }
        // --- CUSTOMER PAYMENT ---
        if (classification === 'customer_payment') {
            const result = await this.toArPaymentInput(update, deps, text);
            if (!result)
                return { type: 'customer_payment_error', chatId };
            return { type: 'customer_payment', chatId, data: result.paymentInput };
        }
        if (classification === 'supplier_payment') {
            const result = await this.toApPaymentInput(update, deps, text);
            if (!result)
                return { type: 'supplier_payment_error', chatId };
            return { type: 'supplier_payment', chatId, data: result.paymentInput };
        }
        // --- AR QUERY ---
        if (classification === 'ar_query') {
            const result = await this.toArQueryInput(update, deps, text);
            if (!result)
                return { type: 'ar_query_error', chatId };
            return { type: 'ar_query', chatId, data: result.queryInput };
        }
        // --- AP QUERY ---
        if (classification === 'ap_query') {
            const result = await this.toApQueryInput(update, deps, text);
            if (!result)
                return { type: 'ap_query_error', chatId };
            return { type: 'ap_query', chatId, data: result.queryInput };
        }
        // --- INCOME STATEMENT QUERY ---
        if (classification === 'income_statement_query') {
            const period = this.parseIncomeStatementPeriod(text);
            if (!period)
                return { type: 'income_statement_error', chatId };
            return {
                type: 'income_statement_query',
                chatId,
                companyId: user.companyId,
                period,
            };
        }
        // --- UNKNOWN ---
        return { type: 'unknown', chatId };
    },
};
