"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetJournalEntryToCreated = exports.markJournalEntryAsProcessed = exports.markJournalEntryAsPending = void 0;
const JournalEntryStatus_1 = require("./JournalEntryStatus");
const markJournalEntryAsPending = (entry) => ({
    ...entry,
    status: JournalEntryStatus_1.JournalEntryStatus.PENDING,
});
exports.markJournalEntryAsPending = markJournalEntryAsPending;
const markJournalEntryAsProcessed = (entry) => ({
    ...entry,
    status: JournalEntryStatus_1.JournalEntryStatus.PROCESSED,
});
exports.markJournalEntryAsProcessed = markJournalEntryAsProcessed;
const resetJournalEntryToCreated = (entry) => ({
    ...entry,
    status: JournalEntryStatus_1.JournalEntryStatus.CREATED,
});
exports.resetJournalEntryToCreated = resetJournalEntryToCreated;
