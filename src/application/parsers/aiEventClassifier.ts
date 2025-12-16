import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error('❌ Falta la variable de entorno GEMINI_API_KEY')
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export async function aiClassifyEvent(message: string): Promise<'sale' | 'purchase' | 'payroll' | 'unknown'> {
  const prompt = `
Clasifica el siguiente mensaje SOLO en una de estas categorías:

- "sale" → si describe una venta.
- "purchase" → si describe una compra de bienes o servicios (incluye pagos a talleres, tintorerías, modistas externas, maquila, servicios, insumos, etc.).
- "payroll" → si describe un pago de nómina a empleados de la empresa (salarios, auxiliares, bodegueros, personal interno).
- "unknown" → si no encaja en ninguna categoría.

⚠️ REGLAS IMPORTANTES

1️⃣ Payroll SOLO si es personal interno:
Ejemplos que son payroll:
- “pagué nómina…”
- “pagué salario…”
- “pagué al bodeguero…”
- “pagué a la auxiliar administrativa…”

2️⃣ NO es payroll si menciona terceros o servicios externos:
Si el mensaje menciona talleres externos, modistas externas, tintorerías, estampadores, maquila, lavanderías, bordados:
→ clasifícalo como "purchase".

3️⃣ Venta:
Todo lo que describa ingresos por ventas de productos o servicios.

4️⃣ Compra:
Cualquier adquisición de bienes, insumos o servicios.

Responde SOLO en JSON estrictamente así:

{
  "eventType": "sale" | "purchase" | "payroll" | "unknown"
}

Mensaje:

"${message}"
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  try {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}') + 1
    const json = JSON.parse(text.substring(start, end))
    return json.eventType ?? 'unknown'
  } catch (err) {
    console.error('❌ Error parseando JSON IA:', err)
    console.error('Texto original:', message)
    console.error('Texto limpiado:', text)
    return 'unknown'
  }
}
