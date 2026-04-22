import type { PayrollEventInput } from '@application/eventos/Payroll/data/PayrollEventInput'
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) throw new Error('Falta GEMINI_API_KEY')

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

function extractJson(text: string): string {
  if (!text) return ''
  const fenced = text.match(/```json([\s\S]*?)```/i)
  if (fenced) return fenced[1].trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}') + 1
  if (start !== -1 && end !== -1) return text.substring(start, end)

  return text.trim()
}

export async function aiParsePayroll(message: string): Promise<PayrollEventInput | null> {
  const prompt = `
Eres un PARSEADOR ESTRICTO para mensajes de pago de nómina (solo empleados internos).
NO conversas. NO inventas datos. Solo JSON.

Responde exactamente:
{
  "companyId": null,
  "description": string | null,
  "amount": number | null,
  "paymentMethod": "cash" | "bank" | null,
  "date": string | null,
  "periodHint": string | null
}

Reglas:
1) Solo aplica si es pago a empleados internos (nómina, salario, auxiliar, bodeguero, conductor, etc.). Si es taller externo, maquila, tintorería, terceros → devuelve null.
2) amount: número mencionado (ej: "pagué 500000", "nómina 1.200.000"). Si no hay → null.
3) description: refleja pago de nómina o a empleado. Si no se puede → null.
4) paymentMethod: efectivo/contado/caja → "cash"; banco/transferencia/nequi/daviplata → "bank"; no mencionado → "cash".
5) date:
   - Fecha explícita (2025-11-10, 10/11/2025) → "YYYY-MM-DDT00:00:00Z".
   - Día+mes sin año (ej: "12 de noviembre") → usa el AÑO ACTUAL y devuelve "YYYY-MM-DDT00:00:00Z".
   - Solo mes/año (ej: "en noviembre 2025") → date = null y periodHint = "2025-11".
   - Solo mes sin año (ej: "en noviembre") → date = null y periodHint = "YYYY-11" usando el AÑO ACTUAL.
   - Sin fecha → null.
6) periodHint: "YYYY-MM" cuando solo hay mes/año; si no, null.
7) companyId siempre null.

Mensaje:
"${message}"
  `.trim()

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  const cleaned = extractJson(raw)

  try {
    const json = JSON.parse(cleaned)
    return json as PayrollEventInput
  } catch (err) {
    console.error('Error parseando JSON de Payroll:', err)
    console.error('Texto original:', raw)
    console.error('Texto limpio:', cleaned)
    return null
  }
}
