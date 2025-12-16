"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.journalEntryToMongo = exports.mongoToJournalEntry = void 0;
// ----------------------
//  MOVEMENT MAPPERS
// ----------------------
const mapMovementFromMongo = (m) => ({
    accountCode: m.accountCode,
    accountName: m.accountName,
    type: m.type,
    amount: m.amount,
    status: m.status,
    group: m.group ?? 'MAIN',
});
const mapMovementToMongo = (m) => ({
    accountCode: m.accountCode,
    accountName: m.accountName,
    type: m.type,
    amount: m.amount,
    status: m.status,
    group: m.group, // already required in Movement
});
// ----------------------
//  JOURNAL ENTRY
// ----------------------
const mongoToJournalEntry = (doc) => ({
    id: doc.id,
    companyId: doc.companyId,
    journalNumber: doc.journalNumber,
    date: doc.date,
    description: doc.description,
    status: doc.status,
    movements: doc.movements.map(mapMovementFromMongo),
});
exports.mongoToJournalEntry = mongoToJournalEntry;
const journalEntryToMongo = (entry) => ({
    id: entry.id,
    companyId: entry.companyId,
    journalNumber: entry.journalNumber,
    date: entry.date,
    description: entry.description,
    status: entry.status,
    movements: entry.movements.map(mapMovementToMongo),
});
exports.journalEntryToMongo = journalEntryToMongo;
