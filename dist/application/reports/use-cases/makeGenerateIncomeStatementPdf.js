"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGenerateIncomeStatementPdf = void 0;
const makeGenerateIncomeStatementPdf = ({ generateIncomeStatement, reportPdfGenerator }) => {
    return {
        execute: async (companyId, period) => {
            const result = await generateIncomeStatement(companyId, period);
            return reportPdfGenerator.generateIncomeStatement({
                companyId,
                title: result.name,
                description: result.description,
                period: result.period,
                sections: result.sections,
                totals: result.totals,
                generatedAt: result.generatedAt,
            });
        },
    };
};
exports.makeGenerateIncomeStatementPdf = makeGenerateIncomeStatementPdf;
