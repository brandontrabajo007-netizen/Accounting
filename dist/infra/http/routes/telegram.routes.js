"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramRoutes = void 0;
const registerPayroll_1 = require("@application/eventos/Payroll/use-case/registerPayroll");
const registerPurchase_1 = require("@application/eventos/Purchase/use-cases/registerPurchase");
const registerSale_1 = require("@application/eventos/sales/use-cases/registerSale");
// Telegram
const telegramAdapter_1 = require("@infra/telegram/telegramAdapter");
const telegramClient_1 = require("@infra/telegram/telegramClient");
// Express
const express_1 = __importDefault(require("express"));
// Repositorios
const dependencies_1 = require("../dependencies");
const router = express_1.default.Router();
exports.telegramRoutes = router;
// Casos de uso
const { registerSale } = (0, registerSale_1.makeRegisterSale)({
    accountRepository: dependencies_1.accountRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    saleAccountMappingRepository: dependencies_1.saleAccountMappingRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
});
const { registerPurchase } = (0, registerPurchase_1.makeRegisterPurchase)({
    accountRepository: dependencies_1.accountRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    purchaseAccountMappingRepository: dependencies_1.purchaseAccountMappingRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
});
const { registerPayroll } = (0, registerPayroll_1.makeRegisterPayroll)({
    accountRepository: dependencies_1.accountRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    payrollAccountMappingRepository: dependencies_1.payrollAccountMappingRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
});
/* ---------------------------------------------------------
   🔧 Helper: validar chatId
--------------------------------------------------------- */
function ensureChatId(chatId, res) {
    if (!chatId) {
        console.error('❌ No chatId found, no puedo enviar respuesta');
        res.status(200).json({ ok: true });
        return false;
    }
    return true;
}
/* ---------------------------------------------------------
   📌 WEBHOOK PRINCIPAL TELEGRAM
--------------------------------------------------------- */
router.post('/webhook', async (req, res) => {
    const update = req.body;
    const chatId = update?.message?.chat?.id ?? null;
    try {
        const detected = await telegramAdapter_1.TelegramAdapter.detectAndParse(update, {
            userRepository: dependencies_1.userRepository,
        });
        if (!detected)
            return res.status(200).json({ ok: true });
        /* ---------------------------------------------------------
           🟦 CASO 1: VENTA
        --------------------------------------------------------- */
        if (detected.type === 'sale') {
            const saleInput = detected.data;
            if (!saleInput.description ||
                saleInput.quantity === null ||
                (saleInput.totalAmount === null && saleInput.unitPrice === null) ||
                saleInput.includesCost === null ||
                saleInput.includesVAT === null) {
                if (!ensureChatId(chatId, res))
                    return;
                await telegramClient_1.TelegramClient.sendMessage({
                    chatId,
                    text: `
❗ No logré entender bien tu mensaje.

Para registrar una venta necesito:

• Cantidad  
• Producto  
• Precio (unitario o total)  
• Si tiene costo  
• Si incluye IVA

Ejemplos:
- Venta 10 pantalones a 50.000 me cuesta 36.000 cada uno, sin IVA
- Venta 8 camisas por 450.000 me costaron 200.000 todas, con IVA
          `.trim(),
                    parseMode: 'Markdown',
                });
                return res.status(200).json({ ok: true });
            }
            const result = await registerSale(saleInput);
            const movementsText = result.movements
                .map((m) => {
                const side = m.type === 'debit' ? '🔺 Debe' : '🔻 Haber';
                return `${side} *${m.accountName}:* ${m.amount}`;
            })
                .join('\n');
            const summary = `
✅ *Venta registrada correctamente*

*Descripción:* ${saleInput.description}
*Total:* ${saleInput.totalAmount}

*Movimientos contables:*
${movementsText}
      `.trim();
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: summary,
                parseMode: 'Markdown',
            });
            return res.status(200).json({ ok: true });
        }
        /* ---------------------------------------------------------
           🟩 CASO 2: COMPRA
        --------------------------------------------------------- */
        if (detected.type === 'purchase') {
            const purchaseInput = detected.data;
            if (!purchaseInput.description || purchaseInput.amount === null || purchaseInput.paymentMethod === null || purchaseInput.debitAccount === null || purchaseInput.includesVAT === null) {
                if (!ensureChatId(chatId, res))
                    return;
                await telegramClient_1.TelegramClient.sendMessage({
                    chatId,
                    text: `
❗ No logré entender la *compra*.

Debes indicar:
• Qué compraste  
• Valor  
• Si incluye IVA  
• Forma de pago  
• Tipo (insumos, gastos, servicios, propiedades)

Ejemplo:
"Compré tela por 700.000 con IVA, pagado por banco, es insumo".
          `.trim(),
                    parseMode: 'Markdown',
                });
                return res.status(200).json({ ok: true });
            }
            const result = await registerPurchase(purchaseInput);
            const movementsText = result.movements
                .map((m) => {
                const side = m.type === 'debit' ? '🔺 Debe' : '🔻 Haber';
                return `${side} *${m.accountName}:* ${m.amount}`;
            })
                .join('\n');
            const summary = `
🧾 *Compra registrada correctamente*

*Descripción:* ${purchaseInput.description}
*Total:* ${purchaseInput.amount}

*Movimientos contables:*
${movementsText}
      `.trim();
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: summary,
                parseMode: 'Markdown',
            });
            return res.status(200).json({ ok: true });
        }
        /* ---------------------------------------------------------
           🟨 CASO 3: PAYROLL — Nómina / Mano de obra
        --------------------------------------------------------- */
        if (detected.type === 'payroll') {
            const payrollInput = detected.data;
            if (!payrollInput.description || payrollInput.amount === null || payrollInput.paymentMethod === null) {
                if (!ensureChatId(chatId, res))
                    return;
                await telegramClient_1.TelegramClient.sendMessage({
                    chatId,
                    text: `
❗ No logré entender el *pago de nómina*.

Ejemplos válidos:

• pagué nómina 500000 por banco  
• pagué mano de obra 300000 en efectivo  
• pago empleados 1.200.000 por banco  
          `.trim(),
                    parseMode: 'Markdown',
                });
                return res.status(200).json({ ok: true });
            }
            const result = await registerPayroll(payrollInput);
            const movementsText = result.movements
                .map((m) => {
                const side = m.type === 'debit' ? '🔺 Debe' : '🔻 Haber';
                return `${side} *${m.accountName}:* ${m.amount}`;
            })
                .join('\n');
            const summary = `
👥 *Pago de nómina registrado correctamente*

*Descripción:* ${payrollInput.description}
*Total:* ${payrollInput.amount}

*Movimientos contables:*
${movementsText}
      `.trim();
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: summary,
                parseMode: 'Markdown',
            });
            return res.status(200).json({ ok: true });
        }
        /* ---------------------------------------------------------
           🟥 ERROR VENTA
        --------------------------------------------------------- */
        if (detected.type === 'sale_error') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `
❗ No logré entender la venta.  
Debes indicar cantidad, producto, precio, costo y si incluye IVA.
        `.trim(),
                parseMode: 'Markdown',
            });
            return res.status(200).json({ ok: true });
        }
        /* ---------------------------------------------------------
           🟧 ERROR COMPRA
        --------------------------------------------------------- */
        if (detected.type === 'purchase_error') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `
❗ No logré entender la compra.  
Ejemplo: "Compré tela por 700.000 sin IVA, pagado por banco, es insumo".
        `.trim(),
                parseMode: 'Markdown',
            });
            return res.status(200).json({ ok: true });
        }
        /* ---------------------------------------------------------
           🟨 ERROR PAYROLL
        --------------------------------------------------------- */
        if (detected.type === 'payroll_error') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `
❗ No logré entender el pago de nómina.  
Ejemplos:  
• pagué nómina 500000 por banco  
• pagué empleados 700000 en efectivo  
        `.trim(),
                parseMode: 'Markdown',
            });
            return res.status(200).json({ ok: true });
        }
        /* ---------------------------------------------------------
           ❓ MENSAJE NO CLASIFICADO
        --------------------------------------------------------- */
        if (detected.type === 'unknown') {
            if (!ensureChatId(chatId, res))
                return;
            await telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: `
No reconozco si tu mensaje es *venta*, *compra* o *pago de nómina*.

💰 Venta:
"Vendí 10 pantalones a 50.000 me cuesta 36.000"

🧾 Compra:
"Compré cremalleras por 300.000 sin IVA en efectivo"

👥 Nómina:
"pagué nómina 500000 por banco"
        `.trim(),
                parseMode: 'Markdown',
            });
        }
        return res.status(200).json({ ok: true });
    }
    catch (error) {
        console.error('❌ Error manejando webhook:', error);
        if (ensureChatId(chatId, res)) {
            telegramClient_1.TelegramClient.sendMessage({
                chatId,
                text: '❌ Error interno procesando tu mensaje.',
            });
        }
        return res.status(200).json({ ok: true });
    }
});
