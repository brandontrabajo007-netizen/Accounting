"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiParseApQuery = aiParseApQuery;
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
async function aiParseApQuery(message) {
    const prompt = `
Eres un PARSEADOR ESTRICTO para consultas de cuentas por pagar.
NO eres chatbot. NO conversas. Solo devuelves JSON.

FORMATO EXACTO:
{
  "companyId": null,
  "queryType": "list_creditors" | "supplier_balance" | "supplier_statement" | null,
  "supplierName": string | null
}

REGLAS:
1) Nada de texto extra. Solo JSON. Sin \`\`\`json\`\`\`.
2) Si algo no se puede determinar -> null. companyId siempre null.
3) queryType:
   - "list_creditors": preguntas tipo "a quien le debo", "lista de proveedores que debo".
   - "supplier_balance": "cuanto le debo a {proveedor}".
   - "supplier_statement": "extracto de {proveedor}", "movimientos de {proveedor}".
4) supplierName: si aplica para "supplier_balance" o "supplier_statement". Si no hay nombre claro -> null.

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
