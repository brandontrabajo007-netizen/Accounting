"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLedger = void 0;
const buildLedger = (entries) => {
    const ledger = {};
    for (const entry of entries) {
        for (const movement of entry.movements) {
            const { accountCode, type, amount } = movement;
            if (!ledger[accountCode]) {
                ledger[accountCode] = {
                    accountCode,
                    debit: 0,
                    credit: 0,
                };
            }
            if (type === 'debit') {
                ledger[accountCode].debit += amount;
            }
            else {
                ledger[accountCode].credit += amount;
            }
        }
    }
    return ledger;
};
exports.buildLedger = buildLedger;
