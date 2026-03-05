"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateIncomeStatementFromEntries = void 0;
const AccountType_1 = require("@domain/accounts/AccountType");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const EventType_enum_1 = require("@domain/events/EventType.enum");
const classifySection = (code) => {
    if (code >= 4100 && code < 4200)
        return 'Sales Revenue';
    if (code >= 6100 && code < 6200)
        return 'Cost of Goods Sold';
    if (code >= 5100 && code < 5400)
        return 'Operating Expenses';
    return null;
};
const movementImpact = (account, movementType, amount) => {
    if (!account)
        return 0;
    const isIncome = account.type === AccountType_1.AccountType.INCOME;
    const isExpense = account.type === AccountType_1.AccountType.EXPENSE;
    if (!isIncome && !isExpense)
        return 0;
    if (isIncome) {
        return movementType === 'credit' ? amount : -amount;
    }
    // Expense
    return movementType === 'debit' ? amount : -amount;
};
const calculateIncomeStatementFromEntries = ({ companyId, period, entries, accounts, }) => {
    const accountMap = new Map();
    accounts.forEach((a) => accountMap.set(a.code, a));
    const sectionMaps = new Map([
        ['Sales Revenue', new Map()],
        ['Cost of Goods Sold', new Map()],
        ['Operating Expenses', new Map()],
    ]);
    for (const entry of entries) {
        if (entry.eventType === EventType_enum_1.EventType.CLOSING)
            continue;
        for (const m of entry.movements) {
            if (m.status !== MovementStatus_1.MovementStatus.PROCESSED)
                continue;
            const account = accountMap.get(m.accountCode);
            const section = classifySection(m.accountCode);
            if (!section)
                continue;
            const delta = movementImpact(account, m.type, m.amount);
            if (delta === 0)
                continue;
            const sectionMap = sectionMaps.get(section);
            if (!sectionMap)
                continue;
            const existing = sectionMap.get(m.accountCode) ?? { code: m.accountCode, name: m.accountName ?? '', total: 0 };
            existing.total += delta;
            sectionMap.set(m.accountCode, existing);
        }
    }
    const sections = [
        { name: 'Sales Revenue', accounts: Array.from(sectionMaps.get('Sales Revenue')?.values() ?? []), total: 0 },
        { name: 'Cost of Goods Sold', accounts: Array.from(sectionMaps.get('Cost of Goods Sold')?.values() ?? []), total: 0 },
        { name: 'Operating Expenses', accounts: Array.from(sectionMaps.get('Operating Expenses')?.values() ?? []), total: 0 },
    ];
    for (const section of sections) {
        section.total = section.accounts.reduce((sum, acc) => sum + acc.total, 0);
    }
    const revenue = sections[0]?.total ?? 0;
    const cogs = sections[1]?.total ?? 0;
    const operatingExpenses = sections[2]?.total ?? 0;
    return {
        name: 'Income Statement',
        description: `Periodo ${period.start} - ${period.end}`,
        period: {
            start: period.start,
            end: period.end,
        },
        sections,
        totals: {
            grossProfit: revenue - cogs,
            operatingIncome: revenue - cogs - operatingExpenses,
            incomeBeforeTaxes: revenue - cogs - operatingExpenses,
        },
        generatedAt: new Date().toISOString(),
    };
};
exports.calculateIncomeStatementFromEntries = calculateIncomeStatementFromEntries;
