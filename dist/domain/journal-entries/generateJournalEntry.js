"use strict";
// src/domain/journal-entries/generateJournalEntry.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJournalEntry = void 0;
const generateJournalEntry = (event, // evento contable específico (venta, gasto…)
accountMapping) => {
    return event.toJournalEntry(accountMapping); // delega al evento
};
exports.generateJournalEntry = generateJournalEntry;
