import type { SaleEventInput } from '@application/eventos/sales/data/SaleEventInput'
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error('❌ Falta la variable de entorno GEMINI_API_KEY')
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

/**
 * Extrae JSON válido desde la salida de Gemini.
 * Elimina ```json ... ``` y captura solo contenido JSON.
 */
function extractJson(text: string): string {
  if (!text) return ''

  // 1. Si viene dentro de ```json ... ```
  const fenced = text.match(/```json([\s\S]*?)```/i)
  if (fenced) {
    return fenced[1].trim()
  }

  // 2. Intentar encontrar cualquier objeto JSON válido en el texto
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1)
  }

  return text.trim()
}

/**
 * Analiza lenguaje natural con IA y devuelve un SaleEventInput.
 * NO inventa valores. Si falta cantidad o precio unitario → retorna null.
 */
export async function aiParseSale(message: string): Promise<SaleEventInput | null> {
  const prompt = `
Eres un PARSEADOR ESTRICTO para mensajes contables. 
NO eres un asistente. NO eres un chatbot. NO debes conversar.
Debes EXTRAER datos del mensaje y devolver ÚNICAMENTE un JSON válido.

FORMATO DE RESPUESTA OBLIGATORIO (JSON exacto):
{
  "companyId": null,
  "description": string | null,
  "totalAmount": number | null,
  "includesVAT": boolean,
  "includesCost": boolean,
  "quantity": number | null,
  "unitCost": number | null,
  "unitPrice": number | null
}

REGLAS ESTRICTAS:
1. Prohibido comentar, explicar, saludar, calcular ganancias o agregar texto adicional.
2. Prohibido usar bloques json. Solo JSON puro.
3. Si un valor no puede determinarse → debe ser null, NO lo inventes.
4. companyId SIEMPRE debe ser null.

5. IVA:
   - "incluye iva" → includesVAT = true
   - "no incluye iva" → includesVAT = false
   - Si no lo menciona → false

6. quantity:
   - Primer número que describa unidades (“10 pantalones”, “5 camisas”).
   - Si no se encuentra → null.

7. Producto:
   - Son las palabras inmediatamente después de la cantidad.
   - Se detiene cuando aparece: “a”, “por”, “total”, “me cuesta”, “cuesta”.
   - Si quantity o producto no existen → description = null.
   - Si existen → description = "Venta de {quantity} {producto}".

8. unitPrice:
   - “a 50000”, “a 50.000”, “cada uno 50000” → unitPrice = 50000.
   - Si no se menciona precio unitario → null.

9. totalAmount:
   - “por 500000”, “total 500000”, “por un total de 500000” → totalAmount = ese valor.
   - Si no se menciona → null.

10. PROHIBIDO HACER CÁLCULOS:
   - NO multiplicar
   - NO dividir
   - NO deducir unitPrice usando totalAmount
   - NO deducir totalAmount usando unitPrice
   exepto para el unitCost que se debe calcular (reglas 13)
   El backend hará los cálculos.

11. unitCost:
   - Solo asignar valores cuando aparezca explícito:
     “me cuesta 36000”, “cuesta 20000”, “me costó 20000”, “costo 15000”.
   - Si aparece un costo total para todas las unidades:
        “me cuesta 360000 todos los pantalones”
     → unitCost = null (NO dividir).
   - Si no se menciona → null.

12. includesCost

Debes ponerlo en true si aparece en el mensaje alguna frase relacionada con el costo:

Frases válidas (indicadores de costo):

“me costó…”
“me costaron…”
“cuesta…”
“cada uno me cuesta…”
“costo de producción…”
“costo…”
“unit cost…” (si aparece)
“coste…”
Si aparece cualquiera de estas, includesCost = true.
Si no aparece ninguna indicación de costo → includesCost = false.

13. unitCost

Determinar el valor real:

Si el mensaje dice “me costaron 200.000 TODAS”
→ unitCost = 200000 / quantity
Si el mensaje dice “me costó 36.000 cada una”
→ unitCost = 36000
Si dice “costo total 200.000”
→ unitCost = 200000 / quantity
Si NO hay información clara → unitCost = null

TU MISIÓN:
- Solo identificar valores explícitos.
- NO analizar, NO opinar.

RESPUESTA FINAL:
Devuelve SOLO el JSON válido, sin explicaciones.

Mensaje a procesar:
"${message}"
  `.trim()

  const result = await model.generateContent(prompt)
  const raw = result.response.text()

  console.log('🤖 IA RAW =>', raw)

  const cleaned = extractJson(raw)

  console.log('🧹 IA CLEANED =>', cleaned)

  try {
    const obj = JSON.parse(cleaned)

    // Si IA respondió null → devolver null
    if (obj === null) return null

    return obj as SaleEventInput
  } catch (err) {
    console.error('❌ Error parseando JSON IA:', err)
    console.error('Texto original:', raw)
    console.error('Texto limpiado:', cleaned)
    return null
  }
}
