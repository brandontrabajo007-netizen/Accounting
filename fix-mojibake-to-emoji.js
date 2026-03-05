/**
 * Reemplaza todo el mojibake (UTF-8 mal interpretado) por emojis reales y caracteres correctos.
 * Solo toca texto corrupto; deja intactos los emojis y acentos ya correctos.
 */
const fs = require('fs')
const path = require('path')

// Mojibake → emoji real. Uso regex con \u para no depender de la codificación del script.
// Secuencias: UTF-8 del emoji leído como Latin-1/Windows-1252 (ð=0xF0, Ÿ=0x9F, etc.)
const EMOJI_FIXES = [
  [/\u00F0\u0178\u2018\u203A/g, '👋'],   [/\u00F0\u0178\u2018\u2039/g, '👋'],   // wave
  [/\u00F0\u0178\u2019\u203A/g, '👋'],   [/\u00F0\u0178\u2019\u2039/g, '👋'],
  [/\u00F0\u0178\u0027\u203A/g, '👋'],   [/\u00F0\u0178\u0027\u2039/g, '👋'],
  [/\u00F0\u0178\u00A4\u2013/g, '🤖'],   // robot ðŸ¤–
  [/\u00F0\u0178\u2019\u00B5/g, '💵'],   // dollar
  [/\u00F0\u0178\u201C\u00A6/g, '📦'],   [/\u00F0\u0178\u201D\u00A6/g, '📦'],   // package
  [/\u00F0\u0178\u2018\u00A5/g, '👥'],   // people
  [/\u00F0\u0178\u00A7\u00BE/g, '🧾'],   // receipt
  [/\u00F0\u0178\u0161\u20AC/g, '🚀'],   // rocket
  [/\u00F0\u0178\u201C\u0160/g, '📊'],   [/\u00F0\u0178\u201D\u0160/g, '📊'],   // chart
  [/\u00F0\u0178\u2019\u00B0/g, '💰'],   // money bag
  [/\u00F0\u0178\u2019\u00B3/g, '💳'],   // card
  [/\u00F0\u0178\u201C\u203A/g, '📋'],   [/\u00F0\u0178\u201C\u2039/g, '📋'],
  [/\u00F0\u0178\u201D\u203A/g, '📋'],   [/\u00F0\u0178\u201D\u2039/g, '📋'],   // clipboard
  [/\u00F0\u0178\u201C\u02C6/g, '📈'],   [/\u00F0\u0178\u201D\u02C6/g, '📈'],   // trend up
  [/\u00F0\u0178\u201C\u2030/g, '📉'],   [/\u00F0\u0178\u201D\u2030/g, '📉'],   // trend down
  [/\u00F0\u0178\u0178\u00A2/g, '🟢'],   // green circle
  [/\u00F0\u0178\u201C\u00B4/g, '📴'],   [/\u00F0\u0178\u201D\u00B4/g, '📴'],   // phone off (Salidas)
  [/\u00F0\u0178\u201C\u201E/g, '📄'],   [/\u00F0\u0178\u201D\u201E/g, '📄'],   // document
  [/\u00E2\u0153\u2026/g, '✅'],          // âœ… check box
  [/\u00E2\u0152/g, '❌'],                // âŒ cross
  [/\u00E2\u0153\u201C/g, '✓'],           // âœ" checkmark
]

// Acentos y puntuación española (mojibake → correcto)
const ACCENT_FIXES = [
  ['Â¡', '¡'],
  ['Â¿', '¿'],
  ['Ã©', 'é'],
  ['Ã¡', 'á'],
  ['Ã­', 'í'],
  ['Ã³', 'ó'],
  ['Ã±', 'ñ'],
  ['Ãº', 'ú'],
  ['SÃ­', 'Sí'],
  ['sÃ­', 'sí'],
  ['NÃ³mina', 'Nómina'],
  ['nÃ³mina', 'nómina'],
  ['VendÃ­', 'Vendí'],
  ['ComprÃ©', 'Compré'],
  ['PaguÃ©', 'Pagué'],
  ['GuÃ­ame', 'Guíame'],
  ['PÃ©rez', 'Pérez'],
  ['telÃ©fono', 'teléfono'],
  ['TelÃ©fono', 'Teléfono'],
  ['direcciÃ³n', 'dirección'],
  ['DirecciÃ³n', 'Dirección'],
  ['CuÃ©ntame', 'Cuéntame'],
  ['quÃ©', 'qué'],
  ['QuÃ©', 'Qué'],
  ['CÃ³mo', 'Cómo'],
  ['cÃ³mo', 'cómo'],
  ['aÃ±o', 'año'],
  ['aÃ±o', 'año'],
  ['rÃ¡pida', 'rápida'],
  ['maÃ±ana', 'mañana'],
  ['quiÃ©n', 'quién'],
  ['asÃ­', 'así'],
  ['TambiÃ©n', 'También'],
  ['CuÃ¡l', 'Cuál'],
  ['cuÃ¡l', 'cuál'],
  ['crÃ©dito', 'crédito'],
  ['nÃºmero', 'número'],
  ['vÃ¡lido', 'válido'],
  ['mÃ­nimo', 'mínimo'],
  ['dÃ­gitos', 'dígitos'],
  ['encontrÃ©', 'encontré'],
  ['EncontrÃ©', 'Encontré'],
  ['PantalÃ³n', 'Pantalón'],
  ['cuÃ¡nto', 'cuánto'],
  ['ganÃ©', 'gané'],
  ['cuÃ¡ndo', 'cuándo'],
  ['estÃ¡', 'está'],
  ['dÃ­a', 'día'],
  // Regex / patrones que deben seguir siendo válidos
  ['gu[iÃ­]ame', 'gu[ií]ame'],
  ['direcci[oÃ³]n', 'direcci[oó]n'],
  ['cr[eÃ©]dito', 'cr[eé]dito'],
]

function fixFile(filePath) {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath)
  if (!fs.existsSync(absPath)) {
    console.warn('No existe:', absPath)
    return
  }
  let content = fs.readFileSync(absPath, 'utf8')
  let changed = false
  for (const [wrong, right] of EMOJI_FIXES) {
    const next = wrong instanceof RegExp ? content.replace(wrong, right) : content.split(wrong).join(right)
    if (next !== content) {
      content = next
      changed = true
    }
  }
  for (const [wrong, right] of ACCENT_FIXES) {
    if (content.includes(wrong)) {
      content = content.split(wrong).join(right)
      changed = true
    }
  }
  if (changed) {
    fs.writeFileSync(absPath, content, 'utf8')
    console.log('Corregido:', absPath)
  } else {
    console.log('Sin cambios:', absPath)
  }
}

const files = [
  'src/infra/http/routes/telegram.routes.ts',
  'src/infra/telegram/telegramClient.ts',
]

files.forEach(fixFile)
console.log('Listo.')
