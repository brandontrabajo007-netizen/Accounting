"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterPurchase = void 0;
const EventType_enum_1 = require("@domain/events/EventType.enum");
const generatePurchaseJournalEntry_1 = require("@domain/events/purchase/generatePurchaseJournalEntry");
const validatePurchaseAccount_1 = require("@domain/events/purchase/validatePurchaseAccount");
const presentJournalEntry_1 = require("../../sales/presenters/presentJournalEntry");
const makeRegisterPurchase = ({ accountRepository, purchaseAccountMappingRepository, journalEntryRepository, processJournalEntry, periodAccessGuard, resolvePeriodId, accountsPayable, supplierHistory, }) => {
    const registerPurchase = async (input) => {
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
        const companyId = input.companyId ?? '';
        if (!companyId) {
            throw new Error('companyId is required');
        }
        const periodId = await resolvePeriodId.resolve(companyId, {
            periodId: input.periodId,
            date,
            periodHint: input.periodHint ?? undefined,
            reopenClosed: input.allowClosedReopen,
        });
        await periodAccessGuard.assertWritable(companyId, periodId);
        const catalog = await accountRepository.getAll();
        const mapping = await purchaseAccountMappingRepository.getPurchaseAccountMappingByCompanyId(companyId);
        const purchaseEvent = {
            type: EventType_enum_1.EventType.PURCHASE,
            companyId,
            description: input.description ?? 'Compra pendiente',
            amount: input.amount ?? 0,
            debitAccount: input.debitAccount ?? 0,
            includesVAT: input.includesVAT ?? false,
            paymentMethod: input.paymentMethod ?? 'cash',
            supplier: input.supplier || undefined,
            date,
            toJournalEntry: (config) => (0, generatePurchaseJournalEntry_1.generatePurchaseJournalEntry)(purchaseEvent, config, catalog),
        };
        (0, validatePurchaseAccount_1.validatePurchaseAccount)(mapping, catalog, purchaseEvent);
        let journalEntry = (0, generatePurchaseJournalEntry_1.generatePurchaseJournalEntry)(purchaseEvent, mapping, catalog);
        journalEntry = { ...journalEntry, eventType: EventType_enum_1.EventType.PURCHASE, periodId };
        await journalEntryRepository.save(journalEntry);
        journalEntry = await processJournalEntry.process(journalEntry.id);
        if (accountsPayable) {
            try {
                await accountsPayable.registerPurchaseIfNeeded({
                    companyId,
                    supplierName: input.supplier ?? null,
                    amount: purchaseEvent.amount ?? 0,
                    date,
                    journalEntryId: journalEntry.id,
                    description: purchaseEvent.description,
                    paymentMethod: purchaseEvent.paymentMethod,
                });
            }
            catch (error) {
                console.error('Error registrando AP (compra):', error);
            }
        }
        if (supplierHistory && input.supplier?.trim()) {
            try {
                await supplierHistory.registerPurchaseHistory({
                    companyId,
                    supplierName: input.supplier,
                    amount: purchaseEvent.amount ?? 0,
                    date,
                    description: purchaseEvent.description,
                    paymentMethod: purchaseEvent.paymentMethod,
                    journalEntryId: journalEntry.id,
                });
            }
            catch (error) {
                console.error('Error registrando historial proveedor (compra):', error);
            }
        }
        return (0, presentJournalEntry_1.presentJournalEntry)(journalEntry, catalog);
    };
    return { registerPurchase };
};
exports.makeRegisterPurchase = makeRegisterPurchase;
