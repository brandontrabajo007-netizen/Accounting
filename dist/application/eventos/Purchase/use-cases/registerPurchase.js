"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterPurchase = void 0;
const EventType_enum_1 = require("@domain/events/EventType.enum");
const generatePurchaseJournalEntry_1 = require("@domain/events/purchase/generatePurchaseJournalEntry");
const validatePurchaseAccount_1 = require("@domain/events/purchase/validatePurchaseAccount");
const presentJournalEntry_1 = require("../../sales/presenters/presentJournalEntry");
const makeRegisterPurchase = ({ accountRepository, purchaseAccountMappingRepository, journalEntryRepository, processJournalEntry }) => {
    const registerPurchase = async (input) => {
        const date = input.date ? new Date(input.date) : new Date();
        if (!input.companyId)
            throw new Error('Company ID is required');
        if (!input.description)
            throw new Error('Description is required');
        if (!input.amount)
            throw new Error('Amount is required');
        if (!input.debitAccount)
            throw new Error('Debit account is required');
        if (!input.paymentMethod)
            throw new Error('Payment method is required');
        const catalog = await accountRepository.getAll();
        const mapping = await purchaseAccountMappingRepository.getPurchaseAccountMappingByCompanyId(input.companyId);
        const purchaseEvent = {
            type: EventType_enum_1.EventType.PURCHASE,
            companyId: input.companyId,
            description: input.description,
            amount: input.amount,
            debitAccount: input.debitAccount,
            includesVAT: input.includesVAT ?? false,
            paymentMethod: input.paymentMethod,
            supplier: input.supplier || undefined,
            date,
            toJournalEntry: (config) => (0, generatePurchaseJournalEntry_1.generatePurchaseJournalEntry)(purchaseEvent, config, catalog),
        };
        (0, validatePurchaseAccount_1.validatePurchaseAccount)(mapping, catalog, purchaseEvent);
        let journalEntry = (0, generatePurchaseJournalEntry_1.generatePurchaseJournalEntry)(purchaseEvent, mapping, catalog);
        await journalEntryRepository.save(journalEntry);
        journalEntry = await processJournalEntry.process(journalEntry.id);
        return (0, presentJournalEntry_1.presentJournalEntry)(journalEntry, catalog);
    };
    return { registerPurchase };
};
exports.makeRegisterPurchase = makeRegisterPurchase;
