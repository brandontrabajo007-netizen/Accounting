"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterCustomerPayment = void 0;
const EventType_enum_1 = require("@domain/events/EventType.enum");
const generateCustomerPaymentJournalEntry_1 = require("@domain/events/customer-payment/generateCustomerPaymentJournalEntry");
const validateCustomerPaymentAccount_1 = require("@domain/events/customer-payment/validateCustomerPaymentAccount");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const presentJournalEntry_1 = require("@application/eventos/sales/presenters/presentJournalEntry");
const makeRegisterCustomerPayment = ({ accountRepository, customerPaymentAccountMappingRepository, journalEntryRepository, processJournalEntry, periodAccessGuard, resolvePeriodId, accountsReceivable, customerHistory, }) => {
    const registerCustomerPayment = async (input) => {
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
            : input.customerName
                ? `Pago de ${input.customerName}`
                : 'Pago de cliente';
        const periodId = await resolvePeriodId.resolve(input.companyId, {
            periodId: input.periodId,
            date,
            periodHint: input.periodHint,
            reopenClosed: input.allowClosedReopen,
        });
        await periodAccessGuard.assertWritable(input.companyId, periodId);
        const accountsCatalog = await accountRepository.getAll();
        const accountMapping = await customerPaymentAccountMappingRepository.getCustomerPaymentAccountMappingByCompanyId(input.companyId);
        const paymentEvent = {
            type: EventType_enum_1.EventType.CUSTOMER_PAYMENT,
            companyId: input.companyId,
            description,
            amount,
            date,
            paymentMethod: input.paymentMethod,
            toJournalEntry: (config) => (0, generateCustomerPaymentJournalEntry_1.generateCustomerPaymentJournalEntry)(paymentEvent, config, accountsCatalog),
        };
        (0, validateCustomerPaymentAccount_1.validateCustomerPaymentAccount)(accountMapping, accountsCatalog);
        let journalEntry = (0, generateCustomerPaymentJournalEntry_1.generateCustomerPaymentJournalEntry)(paymentEvent, accountMapping, accountsCatalog);
        journalEntry = { ...journalEntry, status: JournalEntryStatus_1.JournalEntryStatus.CREATED, eventType: EventType_enum_1.EventType.CUSTOMER_PAYMENT, periodId };
        await journalEntryRepository.save(journalEntry);
        journalEntry = await processJournalEntry.process(journalEntry.id);
        if (accountsReceivable) {
            try {
                await accountsReceivable.registerCustomerPaymentIfNeeded({
                    companyId: input.companyId,
                    customerName: input.customerName ?? null,
                    amount,
                    date,
                    journalEntryId: journalEntry.id,
                    description,
                    paymentMethod: input.paymentMethod ?? null,
                });
            }
            catch (error) {
                console.error('Error registrando AR (pago cliente):', error);
            }
        }
        if (customerHistory && input.customerName?.trim()) {
            try {
                await customerHistory.registerPaymentHistory({
                    companyId: input.companyId,
                    customerName: input.customerName,
                    amount,
                    date,
                    description,
                    paymentMethod: input.paymentMethod ?? null,
                    journalEntryId: journalEntry.id,
                });
            }
            catch (error) {
                console.error('Error registrando historial cliente (pago):', error);
            }
        }
        return (0, presentJournalEntry_1.presentJournalEntry)(journalEntry, accountsCatalog);
    };
    return { registerCustomerPayment };
};
exports.makeRegisterCustomerPayment = makeRegisterCustomerPayment;
