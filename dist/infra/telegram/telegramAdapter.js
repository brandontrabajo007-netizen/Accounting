"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramAdapter = void 0;
const aiEventClassifier_1 = require("@application/parsers/aiEventClassifier");
const aiParsePurchase_1 = require("@application/parsers/aiParsePurchase");
const aiPayrollParser_1 = require("@application/parsers/aiPayrollParser");
const aiSaleParser_1 = require("@application/parsers/aiSaleParser");
const telegramClient_1 = require("./telegramClient");
exports.TelegramAdapter = {
    // ---------------------------------------------------------------------
    // 🟦 1. PARSE SALE
    // ---------------------------------------------------------------------
    async toSaleInput(update, deps) {
        const message = update.message;
        if (!message)
            return null;
        const chatId = message.chat.id;
        const user = await deps.userRepository.findByTelegramId(chatId);
        if (!user)
            return null;
        let text = message.text?.trim() ?? null;
        const voice = message.voice ?? message.audio;
        if (!text && voice) {
            try {
                const file = await telegramClient_1.TelegramClient.getFileDownloadUrl(voice.file_id);
                const transcript = await telegramClient_1.TelegramClient.transcribeAudio(file);
                if (!transcript)
                    return null;
                text = transcript.trim();
            }
            catch {
                return null;
            }
        }
        if (!text)
            return null;
        const sale = await (0, aiSaleParser_1.aiParseSale)(text);
        if (!sale)
            return null;
        sale.companyId = user.companyId;
        return { chatId, saleInput: sale };
    },
    // ---------------------------------------------------------------------
    // 🟩 2. PARSE PURCHASE
    // ---------------------------------------------------------------------
    async toPurchaseInput(update, deps) {
        const message = update.message;
        if (!message)
            return null;
        const chatId = message.chat.id;
        const user = await deps.userRepository.findByTelegramId(chatId);
        if (!user)
            return null;
        let text = message.text?.trim() ?? null;
        const voice = message.voice ?? message.audio;
        if (!text && voice) {
            try {
                const file = await telegramClient_1.TelegramClient.getFileDownloadUrl(voice.file_id);
                const transcript = await telegramClient_1.TelegramClient.transcribeAudio(file);
                if (!transcript)
                    return null;
                text = transcript.trim();
            }
            catch {
                return null;
            }
        }
        if (!text)
            return null;
        const purchase = await (0, aiParsePurchase_1.aiParsePurchase)(text);
        if (!purchase)
            return null;
        purchase.companyId = user.companyId;
        return { chatId, purchaseInput: purchase };
    },
    // ---------------------------------------------------------------------
    // 🟪 3. PARSE PAYROLL (SOLO EMPLEADOS)
    // ---------------------------------------------------------------------
    async toPayrollInput(update, deps) {
        const message = update.message;
        if (!message)
            return null;
        const chatId = message.chat.id;
        const user = await deps.userRepository.findByTelegramId(chatId);
        if (!user)
            return null;
        let text = message.text?.trim() ?? null;
        const voice = message.voice ?? message.audio;
        if (!text && voice) {
            try {
                const file = await telegramClient_1.TelegramClient.getFileDownloadUrl(voice.file_id);
                const transcript = await telegramClient_1.TelegramClient.transcribeAudio(file);
                if (!transcript)
                    return null;
                text = transcript.trim();
            }
            catch {
                return null;
            }
        }
        if (!text)
            return null;
        const payroll = await (0, aiPayrollParser_1.aiParsePayroll)(text);
        if (!payroll)
            return null; // IA descarta talleres/tintorerías/etc.
        payroll.companyId = user.companyId;
        return { chatId, payrollInput: payroll };
    },
    // ---------------------------------------------------------------------
    // 🟧 4. DETECTOR DE EVENTO (sale | purchase | payroll | unknown)
    // ---------------------------------------------------------------------
    async detectAndParse(update, deps) {
        const text = update.message?.text ?? null;
        const chatId = update.message?.chat?.id;
        if (!text || !chatId)
            return null;
        const classification = await (0, aiEventClassifier_1.aiClassifyEvent)(text);
        console.log('🔍 Clasificación IA:', classification);
        // --- SALE ---
        if (classification === 'sale') {
            const result = await this.toSaleInput(update, deps);
            if (!result)
                return { type: 'sale_error', chatId };
            return { type: 'sale', chatId, data: result.saleInput };
        }
        // --- PURCHASE ---
        if (classification === 'purchase') {
            const result = await this.toPurchaseInput(update, deps);
            if (!result)
                return { type: 'purchase_error', chatId };
            return { type: 'purchase', chatId, data: result.purchaseInput };
        }
        // --- PAYROLL ---
        if (classification === 'payroll') {
            const result = await this.toPayrollInput(update, deps);
            if (!result)
                return { type: 'payroll_error', chatId };
            return { type: 'payroll', chatId, data: result.payrollInput };
        }
        // --- UNKNOWN ---
        return { type: 'unknown', chatId };
    },
};
