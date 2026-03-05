import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

const TELEGRAM_API_BASE = 'https://api.telegram.org'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!BOT_TOKEN) throw new Error('❌ Falta TELEGRAM_BOT_TOKEN en .env')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) throw new Error('❌ Falta GEMINI_API_KEY en .env')

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const transcriberModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseMimeType: 'text/plain',
    temperature: 0,
  },
})

export interface TelegramSendMessagePayload {
  chatId: number
  text: string
  parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML'
  replyMarkup?: TelegramReplyMarkup
}

export interface TelegramSendDocumentPayload {
  chatId: number
  file: Buffer
  filename: string
  caption?: string
}

export interface TelegramInlineKeyboardButton {
  text: string
  callback_data?: string
  url?: string
  copy_text?: {
    text: string
  }
}

export interface TelegramReplyMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][]
}

export const TelegramClient = {
  // ------------------------------------------------------------
  // dY"" RESPONDER CALLBACK (botones)
  // ------------------------------------------------------------
  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    const url = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/answerCallbackQuery`

    const body = {
      callback_query_id: callbackQueryId,
      text,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.error('ƒ?O Error respondiendo callback:', await res.text())
    }
  },
  // ------------------------------------------------------------
  // 📨 ENVIAR MENSAJES A TELEGRAM
  // ------------------------------------------------------------
  async sendMessage({ chatId, text, parseMode, replyMarkup }: TelegramSendMessagePayload): Promise<void> {
    const url = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/sendMessage`

    const body = {
      chat_id: chatId,
      text,
      parse_mode: parseMode ?? 'Markdown',
      reply_markup: replyMarkup,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.error('❌ Error enviando mensaje:', await res.text())
    }
  },

  // ------------------------------------------------------------
  // 📄 ENVIAR DOCUMENTO (PDF)
  // ------------------------------------------------------------
  async sendDocument({ chatId, file, filename, caption }: TelegramSendDocumentPayload): Promise<void> {
    const url = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/sendDocument`

    const formData = new FormData()
    formData.append('chat_id', String(chatId))
    const fileBytes = Uint8Array.from(file)
    formData.append('document', new Blob([fileBytes], { type: 'application/pdf' }), filename)
    if (caption) {
      formData.append('caption', caption)
      formData.append('parse_mode', 'Markdown')
    }

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      console.error('âŒ Error enviando documento:', await res.text())
    }
  },

  // ------------------------------------------------------------
  // 🔗 OBTENER URL DESCARGA DE ARCHIVO (audio/voz)
  // ------------------------------------------------------------
  async getFileDownloadUrl(fileId: string): Promise<string> {
    const url = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/getFile?file_id=${fileId}`

    const res = await fetch(url)
    if (!res.ok) {
      console.error('❌ Error obteniendo file info:', await res.text())
      throw new Error('No se pudo obtener el archivo de Telegram')
    }

    const data = await res.json()
    const filePath = data.result.file_path
    return `${TELEGRAM_API_BASE}/file/bot${BOT_TOKEN}/${filePath}`
  },

  // ------------------------------------------------------------
  // 🎤 TRANSCRIBIR AUDIO (Telegram → Gemini Flash)
  // ------------------------------------------------------------
  async transcribeAudio(fileUrl: string): Promise<string | null> {
    try {
      console.log('🎧 Descargando audio desde:', fileUrl)

      const audioBuffer = await fetch(fileUrl).then((r) => r.arrayBuffer())
      const bytes = new Uint8Array(audioBuffer)

      console.log('🤖 Enviando audio a Gemini para transcripción…')

      const response = await transcriberModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Transcribe exactamente el audio a texto en español. No agregues preguntas ni comentarios.',
              },
              {
                inlineData: {
                  mimeType: 'audio/ogg; codecs=opus',
                  data: Buffer.from(bytes).toString('base64'),
                },
              },
            ],
          },
        ],
      })

      const transcript = response.response.text().trim()
      console.log('📄 Transcripción:', transcript)
      return transcript
    } catch (err) {
      console.error('❌ Error transcribiendo audio:', err)
      return null
    }
  },
}
