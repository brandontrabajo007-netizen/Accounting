"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPasswordResetTelegramPayload = exports.getPasswordResetFrontendBaseUrl = void 0;
exports.issuePasswordResetLink = issuePasswordResetLink;
exports.isPasswordResetTokenValid = isPasswordResetTokenValid;
exports.consumePasswordResetToken = consumePasswordResetToken;
const PasswordResetTokenModel_1 = require("@infra/persistence/mongo/models/PasswordResetTokenModel");
const node_crypto_1 = require("node:crypto");
const DEFAULT_EXPIRATION_MINUTES = 20;
const MIN_EXPIRATION_MINUTES = 5;
const MAX_EXPIRATION_MINUTES = 120;
const normalizeBaseUrl = (value) => {
    if (!value)
        return null;
    const trimmed = value.trim().replace(/\/+$/, '');
    if (!trimmed)
        return null;
    try {
        const parsed = new URL(trimmed);
        if (!/^https?:$/i.test(parsed.protocol))
            return null;
        return parsed.toString().replace(/\/+$/, '');
    }
    catch {
        return null;
    }
};
const getFirstCorsOrigin = () => {
    const origins = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((origin) => normalizeBaseUrl(origin))
        .filter((origin) => Boolean(origin));
    return origins[0] ?? null;
};
const getPasswordResetExpirationMinutes = () => {
    const configured = Number(process.env.PASSWORD_RESET_EXPIRATION_MINUTES ?? DEFAULT_EXPIRATION_MINUTES);
    if (!Number.isFinite(configured))
        return DEFAULT_EXPIRATION_MINUTES;
    return Math.max(MIN_EXPIRATION_MINUTES, Math.min(MAX_EXPIRATION_MINUTES, Math.round(configured)));
};
const getPasswordResetFrontendBaseUrl = () => {
    const configured = normalizeBaseUrl(process.env.PASSWORD_RESET_FRONTEND_URL) ??
        normalizeBaseUrl(process.env.FRONTEND_URL) ??
        getFirstCorsOrigin() ??
        normalizeBaseUrl(process.env.APP_URL) ??
        'http://localhost:5173';
    if (process.env.NODE_ENV === 'production' && /^http:\/\/localhost(?::\d+)?$/i.test(configured)) {
        console.warn('[auth] Password reset link is using localhost in production. Set PASSWORD_RESET_FRONTEND_URL.');
    }
    return configured;
};
exports.getPasswordResetFrontendBaseUrl = getPasswordResetFrontendBaseUrl;
const hashPasswordResetToken = (rawToken) => {
    return (0, node_crypto_1.createHash)('sha256').update(rawToken).digest('hex');
};
async function issuePasswordResetLink(params) {
    const now = new Date();
    const expirationMinutes = getPasswordResetExpirationMinutes();
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60000);
    const token = (0, node_crypto_1.randomBytes)(32).toString('hex');
    const tokenHash = hashPasswordResetToken(token);
    await PasswordResetTokenModel_1.PasswordResetTokenMongoModel.updateMany({
        userId: params.userId,
        usedAt: null,
        expiresAt: { $gt: now },
    }, { $set: { usedAt: now } });
    await PasswordResetTokenModel_1.PasswordResetTokenMongoModel.create({
        userId: params.userId,
        companyId: params.companyId,
        tokenHash,
        requestedByUserId: params.requestedByUserId ?? null,
        expiresAt,
    });
    const resetUrl = `${(0, exports.getPasswordResetFrontendBaseUrl)()}/reset-password?token=${encodeURIComponent(token)}`;
    return { token, resetUrl, expiresAt };
}
async function isPasswordResetTokenValid(rawToken) {
    const token = rawToken.trim();
    if (!token)
        return false;
    const tokenHash = hashPasswordResetToken(token);
    const now = new Date();
    const count = await PasswordResetTokenModel_1.PasswordResetTokenMongoModel.countDocuments({
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: now },
    });
    return count > 0;
}
async function consumePasswordResetToken(rawToken) {
    const token = rawToken.trim();
    if (!token)
        return null;
    const now = new Date();
    const tokenHash = hashPasswordResetToken(token);
    const doc = await PasswordResetTokenModel_1.PasswordResetTokenMongoModel.findOneAndUpdate({
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: now },
    }, { $set: { usedAt: now } }, { new: true });
    if (!doc)
        return null;
    return { userId: doc.userId, companyId: doc.companyId };
}
const canUseTelegramUrlButton = (url) => {
    if (!/^https:\/\//i.test(url))
        return false;
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1')
            return false;
        if (host.endsWith('.local'))
            return false;
        return true;
    }
    catch {
        return false;
    }
};
const resetExpiresFormatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
});
const buildPasswordResetTelegramPayload = (resetUrl, expiresAt) => {
    const canOpenDirectly = canUseTelegramUrlButton(resetUrl);
    const expiresLabel = resetExpiresFormatter.format(expiresAt);
    const openHint = canOpenDirectly ? 'Toca "Abrir enlace" para continuar.' : 'Si no puedes abrir directo, usa "Copiar enlace".';
    const text = [
        '🔐 *Recuperacion segura de contrasena*',
        '',
        'Recibimos una solicitud para cambiar tu contrasena.',
        '',
        `⏳ Vigencia: ${expiresLabel} (America/Bogota)`,
        '🔒 Enlace personal y de un solo uso.',
        '🛡️ Nunca te pediremos la contrasena por chat.',
        '',
        openHint,
        '',
        `Enlace: ${resetUrl}`,
        '',
        'Si no solicitaste este cambio, ignora este mensaje.',
    ].join('\n');
    const firstRow = canOpenDirectly ? [{ text: 'Abrir enlace', url: resetUrl }] : [];
    const secondRow = [{ text: 'Copiar enlace', copy_text: { text: resetUrl } }];
    return {
        text,
        replyMarkup: {
            inline_keyboard: [...(firstRow.length ? [firstRow] : []), [secondRow[0]]],
        },
    };
};
exports.buildPasswordResetTelegramPayload = buildPasswordResetTelegramPayload;
