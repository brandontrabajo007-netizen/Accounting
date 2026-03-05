"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeListAccountMovements = void 0;
const AccountType_1 = require("@domain/accounts/AccountType");
const makeListAccountMovements = ({ ledgerMovementRepository, accountRepository, accountingPeriodRepository }) => ({
    execute: async ({ companyId, accountCode, periodId, from, to, page = 1, limit = 50, includeRunningBalance = true }) => {
        const account = await accountRepository.getByCode(accountCode);
        let periodStart;
        let periodEnd;
        if (periodId) {
            const period = await accountingPeriodRepository.findById(periodId);
            if (!period)
                throw new Error('Periodo no encontrado');
            if (period.companyId !== companyId)
                throw new Error('El periodo no pertenece a la empresa');
            periodStart = period.start;
            periodEnd = period.end;
        }
        const clampedFrom = from ?? periodStart;
        const clampedTo = to ?? periodEnd;
        if (clampedFrom && clampedTo && clampedTo < clampedFrom) {
            throw new Error('El rango de fechas es inválido');
        }
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(Math.max(limit, 1), 200);
        const increaseIsDebit = account.type === AccountType_1.AccountType.ASSET || account.type === AccountType_1.AccountType.EXPENSE;
        const net = (debit, credit) => (increaseIsDebit ? debit - credit : credit - debit);
        const [list, opening] = await Promise.all([
            ledgerMovementRepository.findByAccount({
                companyId,
                accountCode,
                periodId,
                from: clampedFrom,
                to: clampedTo,
                page: safePage,
                limit: safeLimit,
            }),
            includeRunningBalance && clampedFrom
                ? ledgerMovementRepository.sumBefore({
                    companyId,
                    accountCode,
                    periodId,
                    from: clampedFrom,
                    to: clampedTo,
                    before: clampedFrom,
                })
                : { debit: 0, credit: 0 },
        ]);
        const initialBalance = includeRunningBalance ? net(opening.debit, opening.credit) : 0;
        let runningBalance = initialBalance;
        const items = list.items.map((movement) => {
            const delta = net(movement.debit, movement.credit);
            if (includeRunningBalance) {
                runningBalance += delta;
            }
            return {
                ...movement,
                balanceAfter: includeRunningBalance ? runningBalance : undefined,
            };
        });
        const finalBalance = includeRunningBalance ? runningBalance : undefined;
        return {
            account: {
                code: account.code,
                name: account.name,
                type: account.type,
            },
            filters: {
                periodId,
                from: clampedFrom,
                to: clampedTo,
            },
            pageInfo: {
                page: safePage,
                limit: safeLimit,
                total: list.total,
                hasMore: safePage * safeLimit < list.total,
            },
            totals: list.totals,
            initialBalance,
            finalBalance,
            items,
        };
    },
});
exports.makeListAccountMovements = makeListAccountMovements;
