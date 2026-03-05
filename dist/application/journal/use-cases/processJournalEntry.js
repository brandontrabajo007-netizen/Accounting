"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeProcessJournalEntry = void 0;
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const makeProcessJournalEntry = (journalRepo, ledgerPoster, periodAccessGuard) => {
    const processEntry = async (entry, previousEntry) => {
        await periodAccessGuard.assertWritable(entry.companyId, entry.periodId);
        entry.status = JournalEntryStatus_1.JournalEntryStatus.PENDING;
        await journalRepo.save(entry);
        await ledgerPoster.post(entry, previousEntry ?? null);
        const allProcessed = entry.movements.every((m) => m.status === MovementStatus_1.MovementStatus.PROCESSED);
        entry.status = allProcessed ? JournalEntryStatus_1.JournalEntryStatus.PROCESSED : JournalEntryStatus_1.JournalEntryStatus.PENDING;
        await journalRepo.save(entry);
        return entry;
    };
    return {
        process: async (journalEntryId, previousEntry) => {
            const entry = await journalRepo.findById(journalEntryId);
            if (!entry)
                throw new Error('Journal entry not found');
            return processEntry(entry, previousEntry);
        },
        processEntry,
    };
};
exports.makeProcessJournalEntry = makeProcessJournalEntry;
