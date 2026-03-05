"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppClient = void 0;
const WHATSAPP_API_BASE = 'https://graph.facebook.com';
const WHATSAPP_API_VERSION = 'v22.0';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? null;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? null;
const getApiUrl = (path) => `${WHATSAPP_API_BASE}/${WHATSAPP_API_VERSION}/${path}`;
const sanitizePhoneNumber = (value) => value.replace(/\D/g, '');
const hasCredentials = () => Boolean(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID);
const uploadDocument = async (file, filename) => {
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
        throw new Error('WhatsApp credentials are not configured');
    }
    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('file', new Blob([new Uint8Array(file)], { type: 'application/pdf' }), filename);
    const response = await fetch(getApiUrl(`${WHATSAPP_PHONE_NUMBER_ID}/media`), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
        body: formData,
    });
    if (!response.ok) {
        throw new Error(`Error uploading WhatsApp media: ${await response.text()}`);
    }
    const payload = (await response.json());
    if (!payload.id) {
        throw new Error('WhatsApp media upload did not return media id');
    }
    return payload.id;
};
const sendDocumentByMediaId = async (to, mediaId, filename, caption) => {
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
        throw new Error('WhatsApp credentials are not configured');
    }
    const response = await fetch(getApiUrl(`${WHATSAPP_PHONE_NUMBER_ID}/messages`), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'document',
            document: {
                id: mediaId,
                filename,
                caption,
            },
        }),
    });
    if (!response.ok) {
        throw new Error(`Error sending WhatsApp document: ${await response.text()}`);
    }
};
exports.WhatsAppClient = {
    isConfigured() {
        return hasCredentials();
    },
    async sendInvoiceDocument(payload) {
        if (!hasCredentials()) {
            return { ok: false, reason: 'not_configured' };
        }
        const to = sanitizePhoneNumber(payload.phone);
        if (to.length < 7) {
            return { ok: false, reason: 'invalid_phone' };
        }
        try {
            const mediaId = await uploadDocument(payload.file, payload.filename);
            await sendDocumentByMediaId(to, mediaId, payload.filename, payload.caption);
            return { ok: true };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown WhatsApp send error';
            return { ok: false, reason: 'send_error', error: message };
        }
    },
};
