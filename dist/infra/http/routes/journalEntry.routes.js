"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.journalEntryRoutes = void 0;
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const validateGroupedJournalEntry_1 = require("@domain/journal-entries/rules/validateGroupedJournalEntry");
const express_1 = require("express");
const dependencies_1 = require("../dependencies");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.journalEntryRoutes = router;
/* ======================================================
   🧠 DERIVAR ESTADO DEL ASIENTO (REGLA DE DOMINIO)
====================================================== */
function deriveJournalEntryStatus(movements) {
    if (movements.some((m) => m.status === 'pending')) {
        return JournalEntryStatus_1.JournalEntryStatus.PENDING;
    }
    if (movements.every((m) => m.status === 'processed')) {
        return JournalEntryStatus_1.JournalEntryStatus.PROCESSED;
    }
    return JournalEntryStatus_1.JournalEntryStatus.CREATED;
}
/* ======================================================
   📄 LISTAR ASIENTOS (PAGINADO + FILTROS)
   GET /journal-entry
====================================================== */
router.get('/journal-entry', auth_1.authMiddleware, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Number(req.query.limit ?? 20), 100);
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
        const status = Object.values(JournalEntryStatus_1.JournalEntryStatus).includes(req.query.status) ? req.query.status : undefined;
        const from = req.query.from ? new Date(String(req.query.from)) : undefined;
        const to = req.query.to ? new Date(String(req.query.to)) : undefined;
        const result = await dependencies_1.journalEntryRepository.findPaginated({
            companyId,
            page,
            limit,
            search,
            status,
            from,
            to,
        });
        return res.json({
            status: true,
            ...result,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(500).json({
            status: false,
            error: message,
        });
    }
});
/* ======================================================
   🔍 OBTENER ASIENTO POR ID
   GET /journal-entry/:id
====================================================== */
router.get('/journal-entry/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const entry = await dependencies_1.journalEntryRepository.findById(id);
        if (!entry) {
            return res.status(404).json({
                status: false,
                error: 'Asiento no encontrado',
            });
        }
        if (entry.companyId !== user.companyId) {
            return res.status(403).json({
                status: false,
                error: 'Acceso denegado',
            });
        }
        return res.json({
            status: true,
            entry,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            status: false,
            error: 'Error interno',
        });
    }
});
/* ======================================================
   ✏️ ACTUALIZAR ASIENTO
   PUT /journal-entry/:id
====================================================== */
router.put('/journal-entry/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const input = req.body;
        /* ---------- Seguridad ---------- */
        if (input.id !== req.params.id) {
            return res.status(400).json({
                status: false,
                error: 'ID del asiento inválido',
            });
        }
        /* ---------- Validación contable ---------- */
        const totalDebit = input.movements.filter((m) => m.type === 'debit').reduce((sum, m) => sum + m.amount, 0);
        const totalCredit = input.movements.filter((m) => m.type === 'credit').reduce((sum, m) => sum + m.amount, 0);
        if (totalDebit !== totalCredit) {
            return res.status(400).json({
                status: false,
                error: 'El asiento no cuadra (débitos ≠ créditos)',
            });
        }
        /* ---------- Validar existencia previa ---------- */
        const existingEntry = await dependencies_1.journalEntryRepository.findById(req.params.id);
        if (!existingEntry) {
            return res.status(404).json({
                status: false,
                error: 'Asiento no encontrado',
            });
        }
        /* ---------- Seguridad: ownership ---------- */
        if (existingEntry.companyId !== companyId) {
            return res.status(403).json({
                status: false,
                error: 'Acceso denegado',
            });
        }
        /* ---------- Recuperar grupos originales ---------- */
        const accountGroupMap = new Map();
        for (const m of existingEntry.movements) {
            accountGroupMap.set(m.accountCode, m.group);
        }
        /* ---------- Inferencia de venta compuesta ---------- */
        const hasIncome = input.movements.some((m) => m.accountCode >= 4000 && m.accountCode < 5000);
        const hasCost = input.movements.some((m) => m.accountCode >= 6000 && m.accountCode < 7000);
        const isCompoundSale = hasIncome && hasCost;
        /* ---------- Mapeo a dominio ---------- */
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
        /* ---------- Validación por grupos ---------- */
        try {
            (0, validateGroupedJournalEntry_1.validateGroupedJournalEntry)(movements);
        }
        catch (error) {
            return res.status(400).json({
                status: false,
                error: error instanceof Error ? error.message : 'El asiento no cuadra por grupos',
            });
        }
        const derivedStatus = deriveJournalEntryStatus(movements);
        /* ---------- Construcción FINAL del asiento ---------- */
        const journalEntry = {
            id: input.id,
            companyId: companyId, // 🔥 SIEMPRE desde auth
            date: new Date(input.date),
            description: input.description,
            status: derivedStatus,
            movements,
        };
        await dependencies_1.journalEntryRepository.save(journalEntry);
        return res.json({
            status: true,
            entry: journalEntry,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            status: false,
            error: 'Error actualizando el asiento',
        });
    }
});
