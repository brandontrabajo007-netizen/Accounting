"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCloseAccountingPeriod = void 0;
const node_crypto_1 = require("node:crypto");
const PeriodMustBeOpenPolicy_1 = require("@domain/accounting-periods/PeriodMustBeOpenPolicy");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const calculateIncomeStatementFromEntries_1 = require("@application/reports/services/calculateIncomeStatementFromEntries");
const makeCloseAccountingPeriod = ({ accountingPeriodRepository, journalEntryRepository, periodResultRepository, domainEventBus, transactionRunner, accountRepository, }) => ({
    execute: async (companyId, periodId) => transactionRunner.runInTransaction(async () => {
        const period = await accountingPeriodRepository.lockById(periodId);
        if (!period || period.companyId !== companyId) {
            throw new Error('Accounting period not found');
        }
        (0, PeriodMustBeOpenPolicy_1.ensurePeriodIsOpen)(period);
        const entries = await journalEntryRepository.findByPeriodId(companyId, periodId);
        const pending = entries.filter((e) => e.status !== JournalEntryStatus_1.JournalEntryStatus.PROCESSED);
        if (pending.length > 0) {
            throw new Error('Cannot close period with pending journal entries');
        }
        const accounts = await accountRepository.getAll();
        const incomeStatement = (0, calculateIncomeStatementFromEntries_1.calculateIncomeStatementFromEntries)({
            companyId,
            period: {
                start: period.start.toISOString(),
                end: period.end.toISOString(),
            },
            entries,
            accounts,
        });
        const existingResult = await periodResultRepository.findByPeriod(companyId, periodId);
        await periodResultRepository.save({
            id: existingResult?.id ?? (0, node_crypto_1.randomUUID)(),
            companyId,
            periodId,
            period: { start: period.start, end: period.end },
            incomeStatement,
            generatedAt: new Date(),
        });
        await accountingPeriodRepository.markClosed(periodId);
        const event = {
            type: 'accounting.period.closed',
            payload: { companyId, periodId },
        };
        await domainEventBus.publish(event);
    }),
});
exports.makeCloseAccountingPeriod = makeCloseAccountingPeriod;
