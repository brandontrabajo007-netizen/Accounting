"use strict";
// src/application/reports/use-cases/generateIncomeStatement.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGenerateIncomeStatement = void 0;
const getIncomeStatement_1 = require("../presenters/getIncomeStatement");
const makeGenerateIncomeStatement = (deps) => {
    const { journalEntryRepository, accountRepository } = deps;
    return {
        generateIncomeStatement: async (companyId, period) => {
            // Obtener todos los Journal Entries de la empresa
            const entries = await journalEntryRepository.findByCompanyAndPeriod(companyId, period.start, period.end);
            // Obtener plan de cuentas de la empresa
            const accounts = await accountRepository.getAll();
            // Generar el estado de resultados usando el presenter
            const result = (0, getIncomeStatement_1.getIncomeStatement)(entries, accounts, period);
            return result;
        },
    };
};
exports.makeGenerateIncomeStatement = makeGenerateIncomeStatement;
