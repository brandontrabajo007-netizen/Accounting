"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGenerateAndSaveIncomeStatement = void 0;
const node_crypto_1 = require("node:crypto");
const calculateIncomeStatementFromEntries_1 = require("../services/calculateIncomeStatementFromEntries");
const makeGenerateAndSaveIncomeStatement = ({ accountRepository, incomeStatementRepository, journalEntryRepository, }) => ({
    execute: async (companyId, period) => {
        const accounts = await accountRepository.getAll();
        const entries = await journalEntryRepository.findByCompanyAndPeriod(companyId, new Date(period.start), new Date(period.end));
        const report = (0, calculateIncomeStatementFromEntries_1.calculateIncomeStatementFromEntries)({
            companyId,
            period,
            entries,
            accounts,
        });
        const snapshot = {
            id: (0, node_crypto_1.randomUUID)(),
            companyId,
            period: {
                start: period.start,
                end: period.end,
            },
            sections: report.sections,
            totals: report.totals,
            generatedAt: new Date(),
        };
        await incomeStatementRepository.save(snapshot);
        return report;
    },
});
exports.makeGenerateAndSaveIncomeStatement = makeGenerateAndSaveIncomeStatement;
