"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncomeStatement = void 0;
const buildLedger_1 = require("@domain/reports/buildLedger");
const getIncomeStatement = (entries, accounts, period) => {
    // 1️ Construimos el ledger consolidado
    const ledger = (0, buildLedger_1.buildLedger)(entries);
    // 2️ Preparar la estructura base
    const result = {
        name: 'Income Statement',
        description: `Period ${period.start.toISOString().slice(0, 10)} - ${period.end.toISOString().slice(0, 10)}`,
        period: {
            start: period.start.toISOString(),
            end: period.end.toISOString(),
        },
        sections: [
            { name: 'Sales Revenue', accounts: [], total: 0 },
            { name: 'Cost of Goods Sold', accounts: [], total: 0 },
            { name: 'Operating Expenses', accounts: [], total: 0 },
            { name: 'Other Income', accounts: [], total: 0 },
            { name: 'Other Expenses', accounts: [], total: 0 },
        ],
        totals: {
            grossProfit: 0,
            operatingIncome: 0,
            incomeBeforeTaxes: 0,
        },
        generatedAt: new Date().toISOString(),
    };
    // 3️ Mapa para agrupar cuentas por sección
    const sectionMaps = new Map();
    for (const section of result.sections) {
        sectionMaps.set(section.name, new Map());
    }
    // 4️ Recorrer catálogo de cuentas
    for (const account of accounts) {
        const line = ledger[account.code];
        if (!line)
            continue; // sin movimientos → skip
        const sectionName = classifyAccount(account.code);
        const sectionMap = sectionMaps.get(sectionName);
        if (!sectionMap)
            continue;
        // Cálculo del neto según tipo de sección
        // ingresos → crédito - débito
        // gastos/costos → débito - crédito
        const isIncomeSection = sectionName === 'Sales Revenue' || sectionName === 'Other Income';
        const net = isIncomeSection ? line.credit - line.debit : line.debit - line.credit;
        if (net === 0)
            continue;
        const detail = {
            code: account.code,
            name: account.name,
            total: net,
        };
        sectionMap.set(account.code, detail);
    }
    // 5️ Pasar mapa → resultado final en sections
    for (const section of result.sections) {
        const map = sectionMaps.get(section.name);
        if (!map)
            continue;
        section.accounts = Array.from(map.values());
        section.total = section.accounts.reduce((sum, acc) => sum + acc.total, 0);
    }
    // 6️ Totales principales (igual a tu versión original)
    const revenue = result.sections[0].total;
    const cogs = result.sections[1].total;
    const operatingExpenses = result.sections[2].total;
    const otherIncome = result.sections[3].total;
    const otherExpenses = result.sections[4].total;
    result.totals.grossProfit = revenue - cogs;
    result.totals.operatingIncome = revenue - cogs - operatingExpenses;
    result.totals.incomeBeforeTaxes = revenue - cogs - operatingExpenses + otherIncome - otherExpenses;
    return result;
};
exports.getIncomeStatement = getIncomeStatement;
// ---------------------------------------
//  Classification Logic (extensible)
// ---------------------------------------
const classifyAccount = (code) => {
    if (code >= 4100 && code < 4200)
        return 'Sales Revenue';
    if (code >= 6130 && code < 6140)
        return 'Cost of Goods Sold';
    if (code >= 5100 && code < 5400)
        return 'Operating Expenses';
    if (code >= 4200 && code < 4300)
        return 'Other Income';
    if (code >= 5300 && code < 5350)
        return 'Other Expenses';
    return 'Other Expenses';
};
