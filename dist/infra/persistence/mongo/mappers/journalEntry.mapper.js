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
    periodId: doc.periodId,
    journalNumber: doc.journalNumber,
    date: doc.date,
    description: doc.description,
    status: doc.status,
    movements: doc.movements.map(mapMovementFromMongo),
    eventType: doc.eventType,
    systemGenerated: doc.systemGenerated,
});
exports.mongoToJournalEntry = mongoToJournalEntry;
const journalEntryToMongo = (entry) => ({
    id: entry.id,
    companyId: entry.companyId,
    periodId: entry.periodId,
    journalNumber: entry.journalNumber,
    date: entry.date,
    description: entry.description,
    eventType: entry.eventType,
    status: entry.status,
    movements: entry.movements.map(mapMovementToMongo),
    systemGenerated: entry.systemGenerated,
});
exports.journalEntryToMongo = journalEntryToMongo;
