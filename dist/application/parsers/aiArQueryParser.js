"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiParseArQuery = aiParseArQuery;
const generative_ai_1 = require("@google/generative-ai");
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('Falta la variable de entorno GEMINI_API_KEY');
}
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
function extractJson(text) {
    if (!text)
        return '';
    const fenced = text.match(/```json([\s\S]*?)```/i);
    if (fenced) {
        return fenced[1].trim();
    }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
        return text.substring(start, end + 1);
    }
    return text.trim();
}
async function aiParseArQuery(message) {
    const prompt = `
Eres un PARSEADOR ESTRICTO para consultas de cuentas por cobrar.
NO eres chatbot. NO conversas. Solo devuelves JSON.

FORMATO EXACTO:
{
  "companyId": null,
  "queryType": "list_debtors" | "customer_balance" | "customer_statement" | null,
  "customerName": string | null
}

REGLAS:
1) Nada de texto extra. Solo JSON. Sin \`\`\`json\`\`\`.
2) Si algo no se puede determinar -> null. companyId siempre null.
3) queryType:
   - "list_debtors": preguntas tipo "quien me debe", "lista de clientes que deben".
   - "customer_balance": "cuanto me debe {cliente}".
   - "customer_statement": "extracto de {cliente}", "movimientos de {cliente}".
4) customerName: si aplica para "customer_balance" o "customer_statement". Si no hay nombre claro -> null.

Mensaje:
"${message}"
  `.trim();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = extractJson(raw);
    try {
        const obj = JSON.parse(cleaned);
        if (obj === null)
            return null;
        return obj;
    }
    catch (err) {
        console.error('Error parseando JSON IA:', err);
        console.error('Texto original:', raw);
        console.error('Texto limpiado:', cleaned);
        return null;
    }
}
