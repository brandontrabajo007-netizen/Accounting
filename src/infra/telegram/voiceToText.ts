import { GoogleGenerativeAI } from '@google/generative-ai'
import fetch from 'node-fetch'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error('❌ Falta la variable de entorno GEMINI_API_KEY')
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// Convierte un audio de Telegram en texto
export async function transcribeTelegramAudio(fileUrl: string): Promise<string | null> {
  try {
    // Descargar el audio
    const response = await fetch(fileUrl)
    const buffer = await response.arrayBuffer()

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'audio/ogg',
                data: Buffer.from(buffer).toString('base64'),
              },
            },
          ],
        },
      ],
    })

    const text = result.response.text().trim()
    return text || null
  } catch (e) {
    console.error('❌ Error transcribiendo audio:', e)
    return null
  }
}
