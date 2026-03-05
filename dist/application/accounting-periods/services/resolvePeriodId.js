"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeResolvePeriodId = void 0;
const PeriodMustBeOpenPolicy_1 = require("@domain/accounting-periods/PeriodMustBeOpenPolicy");
const parseDate = (input) => {
    if (!input)
        return null;
    if (input instanceof Date)
        return input;
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const parsePeriodHint = (hint) => {
    if (!hint)
        return null;
    // Espera formatos simples como "2025-11" o "2025/11"
    const normalized = hint.trim().replace('/', '-');
    const match = normalized.match(/^(\d{4})-(\d{1,2})$/);
    if (!match)
        return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12)
        return null;
    // Representamos el inicio del mes para buscar por fecha
    const date = new Date(Date.UTC(year, month - 1, 1));
    return date.toISOString();
};
const makeResolvePeriodId = (periodRepo) => {
    let lastMeta = null;
    const resolve = async (companyId, input) => {
        if (!companyId)
            throw new Error('companyId is required');
        const normalized = typeof input === 'string'
            ? { periodId: input }
            : { periodId: input?.periodId, date: parseDate(input?.date ?? null), periodHint: input?.periodHint ?? null, reopenClosed: input?.reopenClosed };
        const reopenIfClosed = async (periodId) => {
            if (!normalized.reopenClosed)
                return;
            await periodRepo.markOpenExclusive(companyId, periodId);
        };
        let reopenedClosed = false;
        // 1) periodId explícito
        if (normalized.periodId) {
            const period = await periodRepo.findById(normalized.periodId);
            if (!period || period.companyId !== companyId)
                throw new Error('Accounting period not found');
            if (period.status === 'closed') {
                await reopenIfClosed(period.id);
                reopenedClosed = true;
                const reopened = await periodRepo.findById(period.id);
                (0, PeriodMustBeOpenPolicy_1.ensurePeriodIsOpen)(reopened);
                lastMeta = { periodId: period.id, reopenedClosed };
                return period.id;
            }
            (0, PeriodMustBeOpenPolicy_1.ensurePeriodIsOpen)(period);
            lastMeta = { periodId: period.id, reopenedClosed };
            return period.id;
        }
        // 2) Buscar por fecha exacta
        if (normalized.date) {
            const period = await periodRepo.findByDate(companyId, normalized.date);
            if (!period)
                throw new Error(`No accounting period found covering date ${normalized.date.toISOString()}`);
            if (period.status === 'closed') {
                await reopenIfClosed(period.id);
                reopenedClosed = true;
                const reopened = await periodRepo.findById(period.id);
                (0, PeriodMustBeOpenPolicy_1.ensurePeriodIsOpen)(reopened);
                lastMeta = { periodId: period.id, reopenedClosed };
                return period.id;
            }
            (0, PeriodMustBeOpenPolicy_1.ensurePeriodIsOpen)(period);
            lastMeta = { periodId: period.id, reopenedClosed };
            return period.id;
        }
        // 3) Buscar por hint de periodo (ej: "2025-11")
        const hintedDateIso = parsePeriodHint(normalized.periodHint);
        if (hintedDateIso) {
            const hintedDate = new Date(hintedDateIso);
            const period = await periodRepo.findByDate(companyId, hintedDate);
            if (!period)
                throw new Error(`No accounting period found for period hint ${normalized.periodHint}`);
            if (period.status === 'closed') {
                await reopenIfClosed(period.id);
                reopenedClosed = true;
                const reopened = await periodRepo.findById(period.id);
                (0, PeriodMustBeOpenPolicy_1.ensurePeriodIsOpen)(reopened);
                lastMeta = { periodId: period.id, reopenedClosed };
                return period.id;
            }
            (0, PeriodMustBeOpenPolicy_1.ensurePeriodIsOpen)(period);
            lastMeta = { periodId: period.id, reopenedClosed };
            return period.id;
        }
        // 4) Fallback al comportamiento actual: único periodo abierto
        const open = await periodRepo.findOpenByCompany(companyId);
        if (open.length === 0)
            throw new Error('No open accounting period for company');
        if (open.length > 1)
            throw new Error('Multiple open accounting periods; specify periodId or date');
        (0, PeriodMustBeOpenPolicy_1.ensurePeriodIsOpen)(open[0]);
        lastMeta = { periodId: open[0].id, reopenedClosed };
        return open[0].id;
    };
    const getLastResolutionMeta = () => lastMeta;
    return { resolve, getLastResolutionMeta };
};
exports.makeResolvePeriodId = makeResolvePeriodId;
