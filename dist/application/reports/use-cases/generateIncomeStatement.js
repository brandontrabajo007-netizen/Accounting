"use strict";
// src/application/reports/use-cases/generateIncomeStatement.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGenerateIncomeStatement = void 0;
const calculateIncomeStatementFromEntries_1 = require("../services/calculateIncomeStatementFromEntries");
const normalizeDate = (value, position) => {
    // Usa zona America/Bogota y asegura incluir todo el día final
    const datePart = value.slice(0, 10); // si viene con tiempo, nos quedamos con YYYY-MM-DD
    const suffix = position === 'start' ? 'T00:00:00.000-05:00' : 'T23:59:59.999-05:00';
    const d = new Date(`${datePart}${suffix}`);
    if (Number.isNaN(d.getTime())) {
        throw new Error(`Fecha inválida: ${value}`);
    }
    return d;
};
const makeGenerateIncomeStatement = ({ accountRepository, journalEntryRepository }) => {
    return {
        generateIncomeStatement: async (companyId, period) => {
            const accounts = await accountRepository.getAll();
            const entries = await journalEntryRepository.findByCompanyAndPeriod(companyId, normalizeDate(period.start, 'start'), normalizeDate(period.end, 'end'));
            return (0, calculateIncomeStatementFromEntries_1.calculateIncomeStatementFromEntries)({
                companyId,
                period,
                entries,
                accounts,
            });
        },
    };
};
exports.makeGenerateIncomeStatement = makeGenerateIncomeStatement;
