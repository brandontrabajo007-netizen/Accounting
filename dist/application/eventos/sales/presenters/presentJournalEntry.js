"use strict";
// src/application/presenters/presentJournalEntry.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.presentJournalEntry = void 0;
const presentJournalEntry = (journalEntry, accountsCatalog) => {
    return {
        ...journalEntry,
        movements: journalEntry.movements.map((mov) => {
            const account = accountsCatalog.find((acc) => acc.code === mov.accountCode);
            return {
                ...mov,
                accountName: account?.name ?? 'Unknown',
                accountType: account?.type ?? 'Unknown',
            };
        }),
    };
};
exports.presentJournalEntry = presentJournalEntry;
