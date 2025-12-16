"use strict";
// src/infra/persistence/in-memory/inMemoryJournalEntryRepository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeInMemoryJournalEntryRepository = void 0;
const memory = {};
const makeInMemoryJournalEntryRepository = () => ({
    async save(entry) {
        if (!memory[entry.companyId]) {
            memory[entry.companyId] = [];
        }
        memory[entry.companyId].push(entry);
    },
    async findById(id) {
        for (const companyId in memory) {
            const found = memory[companyId].find((e) => e.id === id);
            if (found)
                return found;
        }
        return null;
    },
    async findByCompanyAndPeriod(companyId, start, end) {
        const entries = memory[companyId] ?? [];
        return entries.filter((e) => e.date >= start && e.date <= end);
    },
    async deleteAllByCompany(companyId) {
        memory[companyId] = [];
    },
});
exports.makeInMemoryJournalEntryRepository = makeInMemoryJournalEntryRepository;
