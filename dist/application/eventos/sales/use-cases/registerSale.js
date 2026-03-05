"use strict";
// src/application/sales/use-cases/registerSale.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterSale = void 0;
const EventType_enum_1 = require("@domain/events/EventType.enum");
const generateSaleJournalEntry_1 = require("@domain/events/sale/generateSaleJournalEntry");
const validateSaleAccount_1 = require("@domain/events/sale/validateSaleAccount");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const presentJournalEntry_1 = require("../presenters/presentJournalEntry");
const makeRegisterSale = ({ accountRepository, saleAccountMappingRepository, journalEntryRepository, processJournalEntry, periodAccessGuard, resolvePeriodId, accountsReceivable, customerHistory, }) => {
    const registerSale = async (input) => {
        const date = (() => {
            if (input.date) {
                const d = new Date(input.date);
                if (!Number.isNaN(d.getTime()))
                    return d;
            }
            if (input.periodHint) {
                const [year, month] = input.periodHint.split('-').map((v) => Number(v));
                if (year && month && month >= 1 && month <= 12) {
                    return new Date(Date.UTC(year, month - 1, 1));
                }
            }
            return new Date();
        })();
        const includesVAT = input.includesVAT ?? false;
        const includesCost = input.includesCost ?? false;
        const periodId = await resolvePeriodId.resolve(input.companyId, {
            periodId: input.periodId,
            date,
            periodHint: input.periodHint,
            reopenClosed: input.allowClosedReopen,
        });
        // Completar faltantes
        let quantity = input.quantity ?? 0;
        let unitPrice = input.unitPrice ?? null;
        let totalAmount = input.totalAmount ?? null;
        if (unitPrice != null && quantity > 0 && totalAmount == null) {
            totalAmount = quantity * unitPrice;
        }
        if (totalAmount != null && quantity > 0 && unitPrice == null) {
            unitPrice = Math.round(totalAmount / quantity);
        }
        quantity = quantity > 0 ? quantity : 0;
        unitPrice = unitPrice ?? 0;
        totalAmount = totalAmount ?? 0;
        const description = input.description && typeof input.description === 'string' ? input.description : 'Venta pendiente';
        await periodAccessGuard.assertWritable(input.companyId, periodId);
        const accountsCatalog = await accountRepository.getAll();
        const accountMapping = await saleAccountMappingRepository.getSaleAccountMappingByCompanyId(input.companyId);
        const saleEvent = {
            type: EventType_enum_1.EventType.SALE,
            companyId: input.companyId,
            description,
            totalAmount,
            amount: includesVAT && totalAmount > 0 ? Math.round(totalAmount / 1.19) : totalAmount,
            date,
            includesVAT,
            includesCost,
            quantity,
            unitCost: input.unitCost,
            unitPrice,
            paymentMethod: input.paymentMethod ?? null,
            toJournalEntry: (config) => (0, generateSaleJournalEntry_1.generateSaleJournalEntry)(saleEvent, config, accountsCatalog),
        };
        // Validar solo si hay cuentas; no lanzar por faltantes de costo
        (0, validateSaleAccount_1.validateSaleAccount)(accountMapping, accountsCatalog, saleEvent);
        let journalEntry = (0, generateSaleJournalEntry_1.generateSaleJournalEntry)(saleEvent, accountMapping, accountsCatalog);
        journalEntry = { ...journalEntry, status: JournalEntryStatus_1.JournalEntryStatus.CREATED, eventType: EventType_enum_1.EventType.SALE, periodId };
        await journalEntryRepository.save(journalEntry);
        journalEntry = await processJournalEntry.process(journalEntry.id);
        const presented = (0, presentJournalEntry_1.presentJournalEntry)(journalEntry, accountsCatalog);
        if (accountsReceivable) {
            try {
                await accountsReceivable.registerSaleIfNeeded({
                    companyId: input.companyId,
                    customerName: input.customerName ?? null,
                    amount: totalAmount,
                    date,
                    journalEntryId: journalEntry.id,
                    description,
                    paymentMethod: input.paymentMethod ?? null,
                });
            }
            catch (error) {
                console.error('Error registrando AR (venta):', error);
            }
        }
        if (customerHistory && input.customerName?.trim()) {
            try {
                await customerHistory.registerSaleHistory({
                    companyId: input.companyId,
                    customerName: input.customerName,
                    amount: totalAmount,
                    date,
                    description,
                    paymentMethod: input.paymentMethod ?? null,
                    journalEntryId: journalEntry.id,
                });
            }
            catch (error) {
                console.error('Error registrando historial cliente (venta):', error);
            }
        }
        return presented;
    };
    return { registerSale };
};
exports.makeRegisterSale = makeRegisterSale;
