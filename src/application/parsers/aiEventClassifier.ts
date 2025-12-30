import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error('❌ Falta la variable de entorno GEMINI_API_KEY')
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export async function aiClassifyEvent(message: string): Promise<'sale' | 'purchase' | 'payroll' | 'income_statement_query' | 'unknown'> {
  const prompt = `
Clasifica el siguiente mensaje SOLO en una de estas categorías:

- "sale" → si describe una venta.
- "purchase" → si describe una compra de bienes o servicios (incluye pagos a talleres, tintorerías, modistas externas, maquila, servicios, insumos, etc.).
- "payroll" → si describe un pago de nómina a empleados de la empresa (salarios, auxiliares, bodegueros, personal interno).
- "income_statement_query" → si es una pregunta sobre utilidad/ganancia/pérdida para un periodo (hoy, esta semana, este mes, fechas acotadas).
- "unknown" → si no encaja en ninguna categoría.

📋 REGLAS IMPORTANTES

1️⃣ Payroll SOLO si es personal interno:
Ejemplos que son payroll:
- ¿pago nómina?
- ¿pago salario?
- ¿pago al bodeguero?
- ¿pago a la auxiliar administrativa?

2️⃣ NO es payroll si menciona terceros o servicios externos:
Si el mensaje menciona talleres externos, modistas externas, tintorerías, estampadores, maquila, lavanderías, bordados:
→ clasifícalo como "purchase".

3️⃣ Venta:
Todo lo que describa ingresos por ventas de productos o servicios.

4️⃣ Compra:
Cualquier adquisición de bienes, insumos o servicios.

5️⃣ income_statement_query:
- Preguntas tipo "cuanto gané/perdí hoy/esta semana/este mes/en [fechas]".
- Pedidos de "estado de resultados" o "utilidad" para un rango de fechas.
- NO incluye registros de ventas/compras/nomina individuales.

Responde SOLO en JSON estrictamente así:

{
  "eventType": "sale" | "purchase" | "payroll" | "income_statement_query" | "unknown"
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
