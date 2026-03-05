"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGenerateIncomeStatementSnapshotPdf = void 0;
const makeGenerateIncomeStatementSnapshotPdf = ({ incomeStatementRepository, reportPdfGenerator }) => {
    return {
        execute: async (companyId, snapshotId) => {
            const snapshot = await incomeStatementRepository.findById(snapshotId);
            if (!snapshot || snapshot.companyId !== companyId) {
                throw new Error('Estado de resultados no encontrado');
            }
            return reportPdfGenerator.generateIncomeStatement({
                companyId,
                title: 'Estado de Resultados',
                description: `Periodo ${snapshot.period.start} - ${snapshot.period.end}`,
                period: snapshot.period,
                sections: snapshot.sections,
                totals: snapshot.totals,
                generatedAt: snapshot.generatedAt instanceof Date ? snapshot.generatedAt.toISOString() : snapshot.generatedAt,
            });
        },
    };
};
exports.makeGenerateIncomeStatementSnapshotPdf = makeGenerateIncomeStatementSnapshotPdf;
