import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error('Falta la variable de entorno GEMINI_API_KEY')
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export async function aiClassifyEvent(
  message: string,
): Promise<'sale' | 'purchase' | 'payroll' | 'income_statement_query' | 'customer_payment' | 'supplier_payment' | 'ar_query' | 'ap_query' | 'unknown'> {
  const prompt = `
Clasifica el siguiente mensaje en una sola categoria:

- "sale": describe una venta.
- "purchase": describe una compra de bienes o servicios (incluye talleres, tintorerias, maquila, servicios, insumos).
- "payroll": pago de nomina a empleados internos.
- "income_statement_query": consulta de utilidad/ganancia/perdida para un periodo.
- "customer_payment": pago recibido de un cliente.
- "supplier_payment": pago realizado a un proveedor (abono a proveedor, pague a proveedor, pague factura de X).
- "ar_query": consulta de cuentas por cobrar (quien me debe, cuanto me debe X, extracto de X, ejemplo "pasame el extracto de X" o "pasame el historico de X" o "pasame el libro de X").
- "ap_query": consulta de cuentas por pagar (a quien le debo, cuanto le debo a X, extracto de X).
- "unknown": no encaja en ninguna categoria.

Reglas:
1) Payroll solo si es personal interno (nomina, salarios, auxiliares internos).
2) Si menciona talleres externos, tintorerias, maquila o servicios externos, clasifica como "purchase".
3) income_statement_query: preguntas como "cuanto gane hoy/esta semana/este mes" o "estado de resultados" en un rango.
4) Si el mensaje habla de pagar a un proveedor (pague a, abone a, transferencia a proveedor), usa "supplier_payment".
5) Si pregunta por deudas a proveedores, usa "ap_query".

Responde SOLO en JSON:
{
  "eventType": "sale" | "purchase" | "payroll" | "income_statement_query" | "customer_payment" | "supplier_payment" | "ar_query" | "ap_query" | "unknown"
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
    console.error('Error parseando JSON IA:', err)
    console.error('Texto original:', message)
    console.error('Texto limpiado:', text)
    return 'unknown'
  }
}
