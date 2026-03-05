"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeAttemptCloseAccountingPeriod = void 0;
const PeriodMustBeOpenPolicy_1 = require("@domain/accounting-periods/PeriodMustBeOpenPolicy");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const makeAttemptCloseAccountingPeriod = ({ accountingPeriodRepository, journalEntryRepository }) => ({
    execute: async (companyId, periodId) => {
        const period = await accountingPeriodRepository.findById(periodId);
        if (!period || period.companyId !== companyId) {
            throw new Error('Accounting period not found');
        }
        (0, PeriodMustBeOpenPolicy_1.ensurePeriodIsOpen)(period);
        const entries = await journalEntryRepository.findByPeriodId(companyId, periodId);
        const pendingEntries = entries.filter((e) => e.status !== JournalEntryStatus_1.JournalEntryStatus.PROCESSED);
        return {
            period,
            blockers: pendingEntries.map((e) => ({ id: e.id, status: e.status })),
        };
    },
});
exports.makeAttemptCloseAccountingPeriod = makeAttemptCloseAccountingPeriod;
