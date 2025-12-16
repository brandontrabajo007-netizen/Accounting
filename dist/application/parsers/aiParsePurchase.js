"use strict";
// src/application/eventos/Purchase/parsers/aiPurchaseParser.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiParsePurchaseCategory = aiParsePurchaseCategory;
exports.aiParsePurchaseDetails = aiParsePurchaseDetails;
exports.aiParsePurchase = aiParsePurchase;
const generative_ai_1 = require("@google/generative-ai");
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('❌ Falta la variable de entorno GEMINI_API_KEY');
}
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
// -----------------------------------------------------------------------------
// 🧹 Sanear la respuesta de la IA y extraer sólo el JSON
// -----------------------------------------------------------------------------
function extractJson(text) {
    if (!text)
        return '';
    const fenced = text.match(/```json([\s\S]*?)```/i);
    if (fenced)
        return fenced[1].trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    if (start !== -1 && end !== -1) {
        return text.substring(start, end);
    }
    return text.trim();
}
// -----------------------------------------------------------------------------
// 🤖 PARSER A: SOLO CLASIFICACIÓN CONTABLE (debitAccount)
// -----------------------------------------------------------------------------
async function aiParsePurchaseCategory(message) {
    const prompt = `
Eres un PARSEADOR CONTABLE ESTRICTO.
NO eres chatbot, NO conversas, NO explicas.

Tu ÚNICA tarea es decidir la cuenta contable (debitAccount) según el mensaje.

Debes responder SIEMPRE con SOLO este JSON:

{
  "debitAccount": number | null
}

CLASIFICACIÓN:

A) "Insumos" → 1435
   Materiales usados en producción o transformados.
   Ejemplos: telas, hilos, cremalleras, botones, empaques, etiquetas, cartón, cajas, bolsas de envío, insumos de producción.

B) "Gastos" → 5195
   Gastos generales de operación.
   Ejemplos: papelería, aseo, dotación, publicidad, transporte, peajes,
   mensajería, domicilios, limpieza, refrigerios, pequeños mantenimientos.

C) "Servicios" → 5135
   Servicios públicos o servicios contratados.
   Ejemplos: luz, agua, internet, celular, hosting, SaaS, contabilidad,
   honorarios de diseñador, servicios de abogado, servicios de terceros.

D) "Propiedades" → 1524
   Activos fijos que duran más de un año.
   Ejemplos: maquinaria, herramientas duraderas, computadores, muebles, equipos.

🚫 CASOS QUE NO SON COMPRA:
- Pago de nómina
- Pago de empleados
- Sueldos
- Salarios
- Honorarios recurrentes a colaboradores
- Prestaciones sociales
- Liquidaciones laborales

SI el mensaje describe alguno de esos casos, o NO estás seguro de que sea compra,
RESPONDE:

{
  "debitAccount": null
}

MENSAJE A ANALIZAR:
"${message}"

Recuerda: SOLO JSON, sin texto adicional.
  `.trim();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = extractJson(raw);
    try {
        const obj = JSON.parse(cleaned);
        if (typeof obj.debitAccount !== 'number' && obj.debitAccount !== null) {
            return { debitAccount: null };
        }
        return obj;
    }
    catch (err) {
        console.error('❌ Error parseando JSON de PurchaseCategory:', err);
        console.error('Texto original:', raw);
        console.error('Texto limpio:', cleaned);
        return { debitAccount: null };
    }
}
// -----------------------------------------------------------------------------
// 🤖 PARSER B: DATOS GENERALES (description, amount, IVA, método de pago)
// -----------------------------------------------------------------------------
async function aiParsePurchaseDetails(message) {
    const prompt = `
Eres un PARSEADOR ESTRICTO de mensajes de compras.
NO eres chatbot. NO conversas. NO inventas datos.

Debes devolver SOLO este JSON:

{
  "companyId": null,
  "description": string | null,
  "amount": number | null,
  "includesVAT": boolean,
  "paymentMethod": "cash" | "bank" | "credit" | null
}

REGLAS:

1️⃣ amount:
- Extrae el valor TOTAL de la compra si aparece.
- Formatos válidos: "700.000", "700k", "700 mil", "3.200.000", "3.2M".
- Interpreta "mil" como x * 1000, "k" como x * 1000, "M" como x * 1.000.000.
- Si NO hay número claro, usa null.

2️⃣ description:
- Resume en una frase corta lo comprado.
  Ej: "Compra de tela", "Compra de insumos", "Compra cremalleras", "Compra maquinaria".
- Si no se puede determinar, usa null.

3️⃣ includesVAT:
- "incluye iva", "con iva", "iva incluido" → true
- "sin iva", "no incluye iva" → false
- importante si no habla nada sobre el iva siempre va false
-nunca debes dejar este campo null 

4️⃣ paymentMethod:
- "de contado", "pagué en efectivo", "en cash" → "cash"
- "pagué por banco", "transferencia", "nequi", "daviplata", "bancolombia", "pse" → "bank"
- "a crédito", "queda fiado", "lo debo", "por pagar" → "credit"
- Si no especifica → cash.

5️⃣ companyId:
- SIEMPRE debe ir como null.
- NUNCA inventes IDs de empresa.

🚫 CASOS QUE NO SON COMPRA:
- Pago de nómina
- Pago de empleados
- Sueldos
- Salarios
- Honorarios recurrentes de colaboradores
- Prestaciones sociales
- Liquidaciones laborales

SI el mensaje describe uno de esos casos, debes devolver EXACTAMENTE:

{
  "companyId": null,
  "description": null,
  "amount": null,
  "includesVAT": false,
  "paymentMethod": "cash"
}

MENSAJE A ANALIZAR:
"${message}"

Devuelve SOLO JSON válido.
  `.trim();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = extractJson(raw);
    try {
        const obj = JSON.parse(cleaned);
        // Validación mínima
        if (obj === null || typeof obj !== 'object') {
            return null;
        }
        // Normalización defensiva
        return {
            companyId: null,
            description: typeof obj.description === 'string' ? obj.description : null,
            amount: typeof obj.amount === 'number' ? obj.amount : null,
            includesVAT: Boolean(obj.includesVAT),
            paymentMethod: obj.paymentMethod === 'cash' || obj.paymentMethod === 'bank' || obj.paymentMethod === 'credit' ? obj.paymentMethod : null,
        };
    }
    catch (err) {
        console.error('❌ Error parseando JSON de PurchaseDetails:', err);
        console.error('Texto original:', raw);
        console.error('Texto limpio:', cleaned);
        return null;
    }
}
// -----------------------------------------------------------------------------
// 🤖 PARSER FINAL: COMBINA DETALLES + CUENTA CONTABLE
// -----------------------------------------------------------------------------
async function aiParsePurchase(message) {
    const details = await aiParsePurchaseDetails(message);
    // Si no es compra (por nómina, etc.) o error fuerte → devolvemos null
    if (!details) {
        return null;
    }
    const category = await aiParsePurchaseCategory(message);
    // Si ambos devuelven "vacío" → no tratar como compra
    const isEmptyDetails = details.description === null && details.amount === null && details.paymentMethod === null && details.includesVAT === false;
    if (isEmptyDetails && category.debitAccount === null) {
        return null;
    }
    const result = {
        companyId: null,
        description: details.description,
        amount: details.amount,
        includesVAT: details.includesVAT,
        paymentMethod: details.paymentMethod,
        debitAccount: category.debitAccount,
    };
    return result;
}
