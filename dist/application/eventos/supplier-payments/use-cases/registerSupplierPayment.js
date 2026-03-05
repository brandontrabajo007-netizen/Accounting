"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterSupplierPayment = void 0;
const EventType_enum_1 = require("@domain/events/EventType.enum");
const generateSupplierPaymentJournalEntry_1 = require("@domain/events/supplier-payment/generateSupplierPaymentJournalEntry");
const validateSupplierPaymentAccount_1 = require("@domain/events/supplier-payment/validateSupplierPaymentAccount");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const presentJournalEntry_1 = require("@application/eventos/sales/presenters/presentJournalEntry");
const makeRegisterSupplierPayment = ({ accountRepository, supplierPaymentAccountMappingRepository, journalEntryRepository, processJournalEntry, periodAccessGuard, resolvePeriodId, accountsPayable, supplierHistory, }) => {
    const registerSupplierPayment = async (input) => {
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
        const amount = Number.isFinite(input.amount) ? input.amount : 0;
        const description = input.description && input.description.trim()
            ? input.description.trim()
            : input.supplierName
                ? `Pago a ${input.supplierName}`
                : 'Pago a proveedor';
        const periodId = await resolvePeriodId.resolve(input.companyId, {
            periodId: input.periodId,
            date,
            periodHint: input.periodHint,
            reopenClosed: input.allowClosedReopen,
        });
        await periodAccessGuard.assertWritable(input.companyId, periodId);
        const accountsCatalog = await accountRepository.getAll();
        const accountMapping = await supplierPaymentAccountMappingRepository.getSupplierPaymentAccountMappingByCompanyId(input.companyId);
        const paymentEvent = {
            type: EventType_enum_1.EventType.SUPPLIER_PAYMENT,
            companyId: input.companyId,
            description,
            amount,
            date,
            paymentMethod: input.paymentMethod,
            toJournalEntry: (config) => (0, generateSupplierPaymentJournalEntry_1.generateSupplierPaymentJournalEntry)(paymentEvent, config, accountsCatalog),
        };
        (0, validateSupplierPaymentAccount_1.validateSupplierPaymentAccount)(accountMapping, accountsCatalog);
        let journalEntry = (0, generateSupplierPaymentJournalEntry_1.generateSupplierPaymentJournalEntry)(paymentEvent, accountMapping, accountsCatalog);
        journalEntry = { ...journalEntry, status: JournalEntryStatus_1.JournalEntryStatus.CREATED, eventType: EventType_enum_1.EventType.SUPPLIER_PAYMENT, periodId };
        await journalEntryRepository.save(journalEntry);
        journalEntry = await processJournalEntry.process(journalEntry.id);
        if (accountsPayable) {
            try {
                await accountsPayable.registerSupplierPaymentIfNeeded({
                    companyId: input.companyId,
                    supplierName: input.supplierName ?? null,
                    amount,
                    date,
                    journalEntryId: journalEntry.id,
                    description,
                    paymentMethod: input.paymentMethod ?? null,
                });
            }
            catch (error) {
                console.error('Error registrando AP (pago proveedor):', error);
            }
        }
        if (supplierHistory && input.supplierName?.trim()) {
            try {
                await supplierHistory.registerPaymentHistory({
                    companyId: input.companyId,
                    supplierName: input.supplierName,
                    amount,
                    date,
                    description,
                    paymentMethod: input.paymentMethod ?? null,
                    journalEntryId: journalEntry.id,
                });
            }
            catch (error) {
                console.error('Error registrando historial proveedor (pago):', error);
            }
        }
        return (0, presentJournalEntry_1.presentJournalEntry)(journalEntry, accountsCatalog);
    };
    return { registerSupplierPayment };
};
exports.makeRegisterSupplierPayment = makeRegisterSupplierPayment;
