import type { SaleEventInput } from '@application/eventos/sales/data/SaleEventInput'
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error('Falta la variable de entorno GEMINI_API_KEY')
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

function extractJson(text: string): string {
  if (!text) return ''

  const fenced = text.match(/```json([\s\S]*?)```/i)
  if (fenced) {
    return fenced[1].trim()
  }

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1)
  }

  return text.trim()
}

export async function aiParseSale(message: string): Promise<SaleEventInput | null> {
  const prompt = `
Eres un PARSEADOR ESTRICTO para mensajes de ventas.
NO eres chatbot. NO conversas. Solo devuelves JSON.

FORMATO EXACTO:
{
  "companyId": null,
  "description": string | null,
  "totalAmount": number | null,
  "date": string | null,
  "periodHint": string | null,
  "includesVAT": boolean,
  "includesCost": boolean,
  "quantity": number | null,
  "unitCost": number | null,
  "unitPrice": number | null,
  "customerName": string | null,
  "paymentMethod": string | null
}

REGLAS:
1) Nada de texto extra. Solo JSON. Sin \`\`\`json\`\`\`.
2) Si algo no se puede determinar -> null. companyId siempre null.
3) date:
   - Fecha explicita (10/12/2025, 2025-12-10) -> "YYYY-MM-DDT00:00:00Z".
   - Dia+mes sin ano (ej: "el 12 de noviembre") -> usa el ANO ACTUAL y devuelve "YYYY-MM-DDT00:00:00Z".
   - Solo mes/ano (ej: "en noviembre 2025") -> date = null y periodHint = "2025-11".
   - Solo mes sin ano (ej: "en noviembre") -> date = null y periodHint = "YYYY-11" usando el ANO ACTUAL.
   - Si no hay fecha -> null.
4) periodHint: "YYYY-MM" cuando solo mencionan mes/ano; si no, null.
5) IVA: "incluye iva" -> true; "no incluye iva" -> false; si no se menciona -> false.
6) quantity: primer numero que indique unidades ("10 pantalones"). Si no hay -> null.
   - IMPORTANTE: si el nombre del producto contiene patrones como "x12", "x6", "x24", "paq x12", NO multipliques quantity por ese valor.
   - Ejemplo: "venta de 10 pantalonetas x12" -> quantity = 10.
7) Producto: palabras tras la cantidad hasta "a", "por", "total", "me cuesta", "cuesta".
   - Si no hay quantity o producto -> description = null.
   - Si hay ambos -> "Venta de {quantity} {producto}".
8) unitPrice: frases "a 50.000", "cada uno 50000" -> ese valor. Si no, null.
9) totalAmount: frases "por 500000", "total 500000" -> ese valor. Si no, null.
10) PROHIBIDO calcular: no multiplicar ni dividir para deducir unitPrice/totalAmount. Solo se permite calcular unitCost segun la regla 12.
11) includesCost: true si menciona costo (me costo, me cuesta, costaron, costo produccion, etc). Si no, false.
12) unitCost:
   - Si el mensaje deja claro que el valor es POR TODAS las unidades (palabras "total", "todas", "todos", "en total", "costo total") y hay quantity > 0 -> unitCost = costo_total / quantity.
   - Si el valor es unitario o no menciona que sea total ("me cuesta 36.000", "cuesta 36k", "cada uno 36.000", "c/u 36.000") -> unitCost = valor (NO dividir).
   - Si hay costo pero sigue ambiguo -> asume unitario y NO dividir.
   - Si no hay info clara -> null.
13) customerName:
   - Si hay "a {persona}" o "para {persona}" -> customerName = ese nombre.
   - Si no hay nombre claro -> null.
14) paymentMethod:
   - "efectivo", "transferencia", "banco", "tarjeta", "credito", "a credito", "al credito".
   - Si no se menciona -> null.

Mensaje:
"${message}"
  `.trim()

  const result = await model.generateContent(prompt)
  const raw = result.response.text()

  const cleaned = extractJson(raw)

  try {
    const obj = JSON.parse(cleaned)
    if (obj === null) return null
    return obj as SaleEventInput
  } catch (err) {
    console.error('Error parseando JSON IA:', err)
    console.error('Texto original:', raw)
    console.error('Texto limpiado:', cleaned)
    return null
  }
}
