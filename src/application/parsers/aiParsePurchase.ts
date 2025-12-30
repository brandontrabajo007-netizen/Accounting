import type { PurchaseEventInput } from '@application/eventos/Purchase/data/PurchaseEventInput'
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
  if (fenced) return fenced[1].trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}') + 1

  if (start !== -1 && end !== -1) {
    return text.substring(start, end)
  }

  return text.trim()
}

type PurchaseDetailsResult = {
  companyId: null
  description: string | null
  amount: number | null
  includesVAT: boolean
  paymentMethod: 'cash' | 'bank' | 'credit' | null
  date: string | null
  periodHint: string | null
}

type PurchaseCategoryResult = {
  debitAccount: number | null
}

export async function aiParsePurchaseCategory(message: string): Promise<PurchaseCategoryResult> {
  const prompt = `
Eres un PARSEADOR CONTABLE ESTRICTO.
Decide la cuenta contable (debitAccount) según el mensaje.
Solo responde este JSON sin texto adicional:
{
  "debitAccount": number | null
}

Clasificación:
A) "Insumos" → 1435 (materiales/insumos de producción).
B) "Gastos" → 5195 (gastos operativos generales).
C) "Servicios" → 5135 (servicios públicos o contratados).
D) "Propiedades" → 1524 (activos fijos durables).

Casos que NO son compra (nómina, salarios, sueldos, honorarios a colaboradores, prestaciones, liquidaciones) → debitAccount = null.

Mensaje:
"${message}"
  `.trim()

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  const cleaned = extractJson(raw)

  try {
    const obj = JSON.parse(cleaned) as PurchaseCategoryResult
    if (typeof obj.debitAccount !== 'number' && obj.debitAccount !== null) {
      return { debitAccount: null }
    }
    return obj
  } catch (err) {
    console.error('Error parseando JSON de PurchaseCategory:', err)
    console.error('Texto original:', raw)
    console.error('Texto limpio:', cleaned)
    return { debitAccount: null }
  }
}

export async function aiParsePurchaseDetails(message: string): Promise<PurchaseDetailsResult | null> {
  const prompt = `
Eres un PARSEADOR ESTRICTO de mensajes de compras.
No conversas. No inventas datos. Devuelves solo JSON.

Responde exactamente:
{
  "companyId": null,
  "description": string | null,
  "amount": number | null,
  "includesVAT": boolean,
  "paymentMethod": "cash" | "bank" | "credit" | null,
  "date": string | null,
  "periodHint": string | null
}

Reglas:
1) amount: valor TOTAL mencionado. Formatos "700.000", "700k", "700 mil", "3.2M". Si no hay número claro → null.
2) description: frase corta de lo comprado. Si no se puede determinar → null.
3) includesVAT: "incluye/con iva" → true; "sin/no incluye iva" → false; si no menciona → false (nunca null).
4) paymentMethod: efectivo/contado → "cash"; banco/transferencia/nequi/daviplata/bancolombia/pse → "bank"; crédito/fiado/por pagar → "credit"; si no se menciona → "cash".
5) date:
   - Fecha explícita (2025-11-10, 10/11/2025) → "YYYY-MM-DDT00:00:00Z".
   - Día+mes sin año (ej: "12 de noviembre") → usa el AÑO ACTUAL y devuelve "YYYY-MM-DDT00:00:00Z".
   - Solo mes/año (ej: "en noviembre 2025") → date = null y periodHint = "2025-11".
   - Solo mes sin año (ej: "en noviembre") → date = null y periodHint = "YYYY-11" usando el AÑO ACTUAL.
   - Sin fecha → null.
6) periodHint: "YYYY-MM" cuando solo hay mes/año; si no hay pista → null.
7) companyId siempre null.

Si el mensaje es nómina/sueldos/empleados/honorarios de colaboradores/prestaciones/liquidaciones → devuelve:
{
  "companyId": null,
  "description": null,
  "amount": null,
  "includesVAT": false,
  "paymentMethod": "cash",
  "date": null,
  "periodHint": null
}

Mensaje:
"${message}"
  `.trim()

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  const cleaned = extractJson(raw)

  try {
    const obj = JSON.parse(cleaned) as PurchaseDetailsResult
    if (obj === null || typeof obj !== 'object') {
      return null
    }

    return {
      companyId: null,
      description: typeof obj.description === 'string' ? obj.description : null,
      amount: typeof obj.amount === 'number' ? obj.amount : null,
      includesVAT: Boolean(obj.includesVAT),
      paymentMethod: obj.paymentMethod === 'cash' || obj.paymentMethod === 'bank' || obj.paymentMethod === 'credit' ? obj.paymentMethod : null,
      date: typeof obj.date === 'string' ? obj.date : null,
      periodHint: typeof obj.periodHint === 'string' ? obj.periodHint : null,
    }
  } catch (err) {
    console.error('Error parseando JSON de PurchaseDetails:', err)
    console.error('Texto original:', raw)
    console.error('Texto limpio:', cleaned)
    return null
  }
}

export async function aiParsePurchase(message: string): Promise<PurchaseEventInput | null> {
  const details = await aiParsePurchaseDetails(message)

  if (!details) {
    return null
  }

  const category = await aiParsePurchaseCategory(message)

  const isEmptyDetails =
    details.description === null && details.amount === null && details.paymentMethod === null && details.includesVAT === false && details.date === null && details.periodHint === null

  if (isEmptyDetails && category.debitAccount === null) {
    return null
  }

  const result: PurchaseEventInput = {
    companyId: null,
    description: details.description,
    amount: details.amount,
    includesVAT: details.includesVAT,
    paymentMethod: details.paymentMethod,
    debitAccount: category.debitAccount,
    date: details.date,
    periodHint: details.periodHint,
  }

  return result
}
