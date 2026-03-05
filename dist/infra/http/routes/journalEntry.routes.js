"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.journalEntryRoutes = void 0;
const EventType_enum_1 = require("@domain/events/EventType.enum");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const validateGroupedJournalEntry_1 = require("@domain/journal-entries/rules/validateGroupedJournalEntry");
const express_1 = require("express");
const dependencies_1 = require("../dependencies");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.journalEntryRoutes = router;
const deriveJournalEntryStatus = (movements) => {
    if (movements.some((m) => m.status === 'pending'))
        return JournalEntryStatus_1.JournalEntryStatus.PENDING;
    if (movements.every((m) => m.status === 'processed'))
        return JournalEntryStatus_1.JournalEntryStatus.PROCESSED;
    return JournalEntryStatus_1.JournalEntryStatus.CREATED;
};
router.get('/journal-entry', auth_1.authMiddleware, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Number(req.query.limit ?? 20), 100);
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
        const status = Object.values(JournalEntryStatus_1.JournalEntryStatus).includes(req.query.status) ? req.query.status : undefined;
        const from = req.query.from ? new Date(String(req.query.from)) : undefined;
        const to = req.query.to ? new Date(String(req.query.to)) : undefined;
        const rawEvent = typeof req.query.event === 'string' ? req.query.event : typeof req.query.eventType === 'string' ? req.query.eventType : undefined;
        const eventType = Object.values(EventType_enum_1.EventType).includes(rawEvent) ? rawEvent : undefined;
        const result = await dependencies_1.journalEntryRepository.findPaginated({ companyId, page, limit, search, status, from, to, eventType });
        return res.json({ status: true, ...result });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(500).json({ status: false, error: message });
    }
});
router.get('/journal-entry/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const entry = await dependencies_1.journalEntryRepository.findById(id);
        if (!entry)
            return res.status(404).json({ status: false, error: 'Asiento no encontrado' });
        if (entry.companyId !== user.companyId)
            return res.status(403).json({ status: false, error: 'Acceso denegado' });
        return res.json({ status: true, entry });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, error: 'Error interno' });
    }
});
router.put('/journal-entry/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const input = req.body;
        if (input.id !== req.params.id) {
            return res.status(400).json({ status: false, error: 'ID del asiento invalido' });
        }
        const existingEntry = await dependencies_1.journalEntryRepository.findById(req.params.id);
        if (!existingEntry)
            return res.status(404).json({ status: false, error: 'Asiento no encontrado' });
        if (existingEntry.companyId !== companyId)
            return res.status(403).json({ status: false, error: 'Acceso denegado' });
        const totalDebit = input.movements.filter((m) => m.type === 'debit').reduce((sum, m) => sum + m.amount, 0);
        const totalCredit = input.movements.filter((m) => m.type === 'credit').reduce((sum, m) => sum + m.amount, 0);
        const isDraft = input.movements.some((m) => m.status === 'pending');
        if (!isDraft && totalDebit !== totalCredit) {
            return res.status(400).json({ status: false, error: 'El asiento no cuadra (debitos ≠ creditos)' });
        }
        const accountGroupMap = new Map();
        for (const m of existingEntry.movements) {
            accountGroupMap.set(m.accountCode, m.group);
        }
        const hasIncome = input.movements.some((m) => m.accountCode >= 4000 && m.accountCode < 5000);
        const hasCost = input.movements.some((m) => m.accountCode >= 6000 && m.accountCode < 7000);
        const isCompoundSale = hasIncome && hasCost;
        const movements = input.movements.map((m) => {
            let finalGroup = 'MAIN';
            if (isCompoundSale) {
                const isCostGroup = (m.accountCode >= 6000 && m.accountCode < 7000) || (m.accountCode >= 1400 && m.accountCode < 1500);
                finalGroup = isCostGroup ? 'COST' : 'REVENUE';
            }
            else {
                const originalGroup = accountGroupMap.get(m.accountCode);
                finalGroup = originalGroup ?? m.group ?? 'MAIN';
            }
            return {
                accountCode: m.accountCode,
                accountName: m.accountName ?? '',
                type: m.type,
                amount: m.amount,
                status: m.status,
                group: finalGroup,
            };
        });
        try {
            (0, validateGroupedJournalEntry_1.validateGroupedJournalEntry)(movements);
        }
        catch (error) {
            return res.status(400).json({ status: false, error: error instanceof Error ? error.message : 'El asiento no cuadra por grupos' });
        }
        const derivedStatus = deriveJournalEntryStatus(movements);
        const journalEntry = {
            id: input.id,
            companyId,
            date: new Date(input.date),
            description: input.description,
            status: derivedStatus,
            movements,
            eventType: existingEntry.eventType,
            periodId: existingEntry.periodId,
        };
        const processed = await dependencies_1.processJournalEntry.processEntry(journalEntry, existingEntry);
        return res.json({ status: true, entry: processed });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, error: 'Error actualizando el asiento' });
    }
});
