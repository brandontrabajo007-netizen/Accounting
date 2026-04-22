"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeTelegramAudio = transcribeTelegramAudio;
const generative_ai_1 = require("@google/generative-ai");
const node_fetch_1 = __importDefault(require("node-fetch"));
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('❌ Falta la variable de entorno GEMINI_API_KEY');
}
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
// Convierte un audio de Telegram en texto
async function transcribeTelegramAudio(fileUrl) {
    try {
        // Descargar el audio
        const response = await (0, node_fetch_1.default)(fileUrl);
        const buffer = await response.arrayBuffer();
        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType: 'audio/ogg',
                                data: Buffer.from(buffer).toString('base64'),
                            },
                        },
                    ],
                },
            ],
        });
        const text = result.response.text().trim();
        return text || null;
    }
    catch (e) {
        console.error('❌ Error transcribiendo audio:', e);
        return null;
    }
}
