"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterPayroll = void 0;
const EventType_enum_1 = require("@domain/events/EventType.enum");
const generatePayrollJournalEntry_1 = require("@domain/events/payroll/generatePayrollJournalEntry");
const validatePayrollAccount_1 = require("@domain/events/payroll/validatePayrollAccount");
const presentJournalEntry_1 = require("../../sales/presenters/presentJournalEntry");
const makeRegisterPayroll = ({ accountRepository, payrollAccountMappingRepository, journalEntryRepository, processJournalEntry, periodAccessGuard, resolvePeriodId, }) => {
    const registerPayroll = async (input) => {
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
        if (!input.companyId) {
            throw new Error('companyId is required');
        }
        const periodId = await resolvePeriodId.resolve(input.companyId, {
            periodId: input.periodId,
            date,
            periodHint: input.periodHint,
            reopenClosed: input.allowClosedReopen,
        });
        const catalog = await accountRepository.getAll();
        const mapping = await payrollAccountMappingRepository.getPayrollAccountMappingByCompanyId(input.companyId);
        const payrollEvent = {
            type: EventType_enum_1.EventType.PAYROLL,
            companyId: input.companyId,
            description: input.description || 'Nómina pendiente',
            amount: input.amount ?? 0,
            paymentMethod: input.paymentMethod,
            beneficiary: input.beneficiary,
            date,
            toJournalEntry: (config) => (0, generatePayrollJournalEntry_1.generatePayrollJournalEntry)(payrollEvent, config, catalog),
        };
        (0, validatePayrollAccount_1.validatePayrollAccount)(mapping, catalog, payrollEvent);
        await periodAccessGuard.assertWritable(input.companyId, periodId);
        let journalEntry = (0, generatePayrollJournalEntry_1.generatePayrollJournalEntry)(payrollEvent, mapping, catalog);
        journalEntry = { ...journalEntry, eventType: EventType_enum_1.EventType.PAYROLL, periodId };
        await journalEntryRepository.save(journalEntry);
        journalEntry = await processJournalEntry.process(journalEntry.id);
        return (0, presentJournalEntry_1.presentJournalEntry)(journalEntry, catalog);
    };
    return { registerPayroll };
};
exports.makeRegisterPayroll = makeRegisterPayroll;
