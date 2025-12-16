import type { PayrollEventInput } from '@application/eventos/Payroll/data/PayrollEventInput'
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) throw new Error('❌ Falta GEMINI_API_KEY')

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

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
Eres un PARSEADOR ESTRICTO para mensajes de *pago de nómina exclusivamente a empleados*.
NO eres chatbot. NO conversas. NO inventas datos.
Solo parseas si el pago es a PERSONAL DE LA EMPRESA.

Debes devolver SOLO un JSON válido con esta estructura:

{
  "companyId": null,
  "description": string | null,
  "amount": number | null,
  "paymentMethod": "cash" | "bank" | null,
  "date": string | null
}

REGLAS DE INTERPRETACIÓN:

1️⃣ amount  
- Número expresado en el mensaje.  
- Ej: “pagué 500000”, “nómina 1.200.000”, “le pagué al bodeguero 800.000”.

2️⃣ description  
Debe reflejar nómina de empleado:  
- “Pago de nómina”  
- “Pago de salario”  
- “Pago a empleado”  
- “Pago a auxiliar”, “Pago a bodeguero”, “Pago a conductor”, etc.

❌ NO se debe usar payroll para terceros.
Si el mensaje menciona talleres externos, tintorerías, modistas, maquila o servicios de terceros:
NO corresponde a nómina → devolver null.

Ejemplos NO válidos para payroll:
- “pagué taller de confección…”  
- “pagué tintorería…”  
- “pagué estampador…”  
- “pagué modista externa…”

En esos casos debes devolver null.

3️⃣ paymentMethod  
- “en efectivo”, “contado”, “lo pagué en caja” → "cash"  
- “por banco”, “transferencia”, “nequi”, “daviplata” → "bank"  
- No mencionado → null

4️⃣ date  
- Si aparece una fecha explícita → úsala.  
- Si no → null.

5️⃣ companyId  
Debe ser SIEMPRE null. No lo inventes.

⚠️ IMPORTANTE  
Si el mensaje NO describe un pago a un *empleado* → devuelve null.

⚠️ SOLO responde con JSON válido. Nada más.

Mensaje a interpretar:
"${message}"
  `.trim()

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  const cleaned = extractJson(raw)

  try {
    const json = JSON.parse(cleaned)
    return json as PayrollEventInput
  } catch (err) {
    console.error('❌ Error parseando JSON de Payroll:', err)
    console.error('Texto original:', raw)
    console.error('Texto limpio:', cleaned)
    return null
  }
}
