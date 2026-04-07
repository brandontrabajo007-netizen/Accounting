"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiParseSaleItems = aiParseSaleItems;
const generative_ai_1 = require("@google/generative-ai");
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('Falta la variable de entorno GEMINI_API_KEY');
}
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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
async function aiParseSaleItems(message) {
    const prompt = `
Eres un PARSEADOR ESTRICTO de ventas con productos y variantes.
No conversas. Devuelves SOLO JSON.

FORMATO:
{
  "customerName": string | null,
  "paymentMethod": string | null,
  "date": string | null,
  "creditDueDate": string | null,
  "items": [
    {
      "productName": string,
      "variants": [
        {
          "attribute": string | null,
          "value": string,
          "qty": number,
          "unitPrice": number | null,
          "totalPrice": number | null
        }
      ]
    }
  ]
}

REGLAS:
1) Nada de texto extra. Solo JSON.
2) Si un dato no está, usa null.
3) "date" y "creditDueDate" en "YYYY-MM-DD" si se mencionan, si no null.
4) Precios:
   - Si el mensaje dice "cada uno", "unitario", "c/u" -> unitPrice.
   - Si dice "total" o "en total" -> totalPrice.
   - Si no se menciona precio, deja ambos null.
4.1) Cantidades:
   - La cantidad vendida es la que el usuario declara explícitamente (ej: "venta de 10 ...", "vendí 10 ...").
   - NO uses números dentro del nombre del producto como cantidad.
   - Ejemplo: "pantalonetas AAA x12" -> "x12" es parte del producto/empaque, no la cantidad vendida.
5) Variantes:
   - "talla 28" -> attribute="talla", value="28".
   - Si no se indica variante, usa attribute=null y value="__unspecified__".
   - Si se indica variante sin atributo, usa attribute=null y value con el texto.
6) items puede tener varios productos.

Mensaje:
"${message}"
  `.trim();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = extractJson(raw);
    try {
        const obj = JSON.parse(cleaned);
        if (!obj)
            return null;
        return obj;
    }
    catch (err) {
        console.error('Error parseando JSON IA (items):', err);
        console.error('Texto original:', raw);
        console.error('Texto limpiado:', cleaned);
        return null;
    }
}
