export const GUIDED_CALLBACK_PREFIX = 'g'

export const GUIDED_ACTIONS = {
  yes: 'y',
  no: 'n',
  confirm: 'c',
  cancel: 'x',
  unit: 'u',
  total: 't',
} as const

export const buildGuidedCallbackData = (action: string) => [GUIDED_CALLBACK_PREFIX, action].filter(Boolean).join('|')

export const parseGuidedCallbackData = (data?: string) => {
  if (!data) return null
  const [prefix, action] = data.split('|')
  if (prefix !== GUIDED_CALLBACK_PREFIX || !action) return null
  return { action }
}

export const buildYesNoKeyboard = () => ({
  inline_keyboard: [
    [
      { text: '✅ Si', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.yes) },
      { text: '❌ No', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.no) },
    ],
    [{ text: '❌ Cancelar', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.cancel) }],
  ],
})

export const buildUnitTotalKeyboard = () => ({
  inline_keyboard: [
    [
      { text: 'Unitario', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.unit) },
      { text: 'Total', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.total) },
    ],
    [{ text: '❌ Cancelar', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.cancel) }],
  ],
})

export const buildConfirmCancelKeyboard = () => ({
  inline_keyboard: [
    [
      { text: '✅ Confirmar', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.confirm) },
      { text: '❌ Cancelar', callback_data: buildGuidedCallbackData(GUIDED_ACTIONS.cancel) },
    ],
  ],
})

export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

export const isGuidedSaleCommand = (value: string) => {
  const text = normalizeText(value)
  return /\b(venta guiada|registrar venta|nueva venta|crear venta|registrar una venta|guiame con una venta|guiame una venta|guiame con venta)\b/.test(text)
}

export const isGuidedCustomerCommand = (value: string) => {
  const text = normalizeText(value)
  return /\b(guiame para crear cliente|guiame para crear un cliente|crear cliente guiado|crear cliente|crear un cliente|nuevo cliente|registrar cliente)\b/.test(
    text,
  )
}

export const normalizePhoneInput = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  let cleaned = trimmed.replace(/[^\d+]/g, '')
  if (cleaned.includes('+') && !cleaned.startsWith('+')) {
    cleaned = cleaned.replace(/\+/g, '')
  }
  return cleaned
}

export const normalizeOptionalField = (value: string): string | null => {
  const cleaned = value.trim()
  if (!cleaned) return null
  const normalized = normalizeText(cleaned)
  if (normalized === 'sin' || normalized === 'no' || normalized === 'ninguno' || normalized === 'ninguna') return null
  if (/\b(no tengo|sin dato|omitir|omitelo|saltar)\b/.test(normalized)) return null
  return cleaned
}

export const parseCustomerCreateMessage = (rawText: string): { name?: string | null; phone?: string | null; city?: string | null; address?: string | null } | null => {
  const text = rawText.trim()
  if (!text) return null

  const normalized = normalizeText(text)
  const hasCreateKeyword = /\b(crear|nuevo|registrar|agregar)\s+cliente\b/.test(normalized) || /\bcliente\s+nuevo\b/.test(normalized)
  const hasLabels = /(cliente|nombre)\s*[:-]/i.test(text) || /(telefono|tel|celular|cel|whatsapp|phone)\s*[:-]/i.test(text)

  if (!hasCreateKeyword && !hasLabels) return null

  const phoneLabelMatch = text.match(/(?:telefono|tel|celular|cel|whatsapp|phone)\s*[:-]?\s*([+()\d\s-]{7,})/i)
  const phoneRaw = phoneLabelMatch?.[1] ?? null
  const phoneFallbackMatch = !phoneRaw ? text.match(/(\+\d[\d\s-]{6,})/) : null
  let phone = phoneRaw ? normalizePhoneInput(phoneRaw) : phoneFallbackMatch ? normalizePhoneInput(phoneFallbackMatch[1]) : null

  if (phone && phone.replace(/\D/g, '').length < 7) {
    phone = null
  }

  const nameLabelMatch = text.match(/(?:cliente|nombre)\s*[:-]\s*([^\n,;]+)/i)
  let name = nameLabelMatch?.[1]?.trim() ?? null

  const cityLabelMatch = text.match(/(?:ciudad|city)\s*[:-]\s*([^\n,;]+)/i)
  const city = cityLabelMatch?.[1]?.trim() ?? null

  const addressLabelMatch = text.match(/(?:direccion|direcci[oo]n|address)\s*[:-]\s*([^\n,;]+)/i)
  const address = addressLabelMatch?.[1]?.trim() ?? null

  if (!name && hasCreateKeyword) {
    let candidate = text
    candidate = candidate.replace(/(?:crear|nuevo|registrar|agregar)\s+cliente/gi, '')
    candidate = candidate.replace(/cliente\s+nuevo/gi, '')
    if (phoneRaw) candidate = candidate.replace(phoneRaw, '')
    if (phoneFallbackMatch) candidate = candidate.replace(phoneFallbackMatch[1], '')
    candidate = candidate.replace(/(?:telefono|tel|celular|cel|whatsapp|phone)\s*[:-]?/gi, '')
    if (city) candidate = candidate.replace(city, '')
    if (address) candidate = candidate.replace(address, '')
    candidate = candidate.replace(/(?:ciudad|city)\s*[:-]?/gi, '')
    candidate = candidate.replace(/(?:direccion|direcci[oo]n|address)\s*[:-]?/gi, '')
    candidate = candidate.replace(/[,:;]+/g, ' ')
    candidate = candidate.replace(/\s{2,}/g, ' ').trim()
    if (candidate) name = candidate
  }

  if (!name && !phone && !city && !address) return null
  return { name, phone, city: city ? normalizeOptionalField(city) : null, address: address ? normalizeOptionalField(address) : null }
}

export const parseYesNo = (value: string): boolean | null => {
  const text = normalizeText(value)
  const tokens = text.split(/[\s,.;!?]+/).filter(Boolean)
  const hasNo = tokens.includes('no') || tokens.includes('n')
  const hasYes = tokens.includes('si') || tokens.includes('s')
  if (hasNo && !hasYes) return false
  if (hasYes && !hasNo) return true
  return null
}

export const parseDateInput = (value: string): string | null => {
  const text = normalizeText(value)
  const now = new Date()

  if (text.includes('hoy')) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10)
  }

  if (text.includes('manana') || text.includes('mañana')) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    d.setUTCDate(d.getUTCDate() + 1)
    return d.toISOString().slice(0, 10)
  }

  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (isoMatch) {
    const d = new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])))
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }

  const dmMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})\/(\d{4})\b/)
  if (dmMatch) {
    const d = new Date(Date.UTC(Number(dmMatch[3]), Number(dmMatch[2]) - 1, Number(dmMatch[1])))
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }

  return null
}
