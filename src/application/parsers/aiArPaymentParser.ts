import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error('Falta la variable de entorno GEMINI_API_KEY')
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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

export type ArPaymentInput = {
  companyId: string | null
  customerName: string | null
  amount: number | null
  date: string | null
  periodHint: string | null
  paymentMethod: string | null
}

export async function aiParseArPayment(message: string): Promise<ArPaymentInput | null> {
  const prompt = `
Eres un PARSEADOR ESTRICTO para pagos de clientes (cuentas por cobrar).
NO eres chatbot. NO conversas. Solo devuelves JSON.

FORMATO EXACTO:
{
  "companyId": null,
  "customerName": string | null,
  "amount": number | null,
  "date": string | null,
  "periodHint": string | null,
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
5) customerName: extraer el nombre del cliente que pago (ej: "Alfredo Celis me pago ...") -> "Alfredo Celis".
6) amount: monto pagado (ej: "me pago 400000", "pago 400.000").
7) paymentMethod: "efectivo", "transferencia", "banco", "tarjeta", "nequi", "daviplata". Si no se menciona -> null.

Mensaje:
"${message}"
  `.trim()

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  const cleaned = extractJson(raw)

  try {
    const obj = JSON.parse(cleaned)
    if (obj === null) return null
    return obj as ArPaymentInput
  } catch (err) {
    console.error('Error parseando JSON IA:', err)
    console.error('Texto original:', raw)
    console.error('Texto limpiado:', cleaned)
    return null
  }
}
