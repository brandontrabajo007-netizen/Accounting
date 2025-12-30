import type { GeneratedPdf, IncomeStatementPdfModel, ReportPdfGenerator } from '@application/reports/ports/ReportPdfGenerator'
import PDFDocument from 'pdfkit'

const formatNumber = (value: number) =>
  value.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

// 👉 NUEVO: formato humano para fecha y hora
const formatDateTime = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const translateSection = (name: string) => {
  if (name === 'Sales Revenue') return 'Ingresos'
  if (name === 'Cost of Goods Sold') return 'Costo de Ventas'
  if (name === 'Operating Expenses') return 'Gastos Operativos'
  return name
}

// ─────────────────────────────────────────────────────
// TABLA DE SECCIÓN
// ─────────────────────────────────────────────────────
const drawSectionTable = (doc: PDFKit.PDFDocument, section: IncomeStatementPdfModel['sections'][number], opts: { x: number; y: number; width: number }) => {
  const rowHeight = 20
  const colWidths = [70, opts.width - 70 - 110, 110] // Código | Cuenta | Valor
  let y = opts.y

  // ── TÍTULO DE SECCIÓN
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#000')
  doc.text(translateSection(section.name), opts.x, y)
  y += rowHeight - 6

  // ── HEADER
  doc.rect(opts.x, y, opts.width, rowHeight).fill('#f3f3f3')
  doc.fillColor('#000').fontSize(9).font('Helvetica-Bold')

  doc.text('Código', opts.x + 6, y + 6)
  doc.text('Cuenta', opts.x + colWidths[0] + 6, y + 6)
  doc.text('Valor', opts.x + colWidths[0] + colWidths[1], y + 6, { width: colWidths[2] - 6, align: 'right' })

  y += rowHeight
  doc.font('Helvetica')

  // ── FILAS
  section.accounts.forEach((line) => {
    doc.fontSize(9).fillColor('#000')

    doc.text(String(line.code), opts.x + 6, y + 5)
    doc.text(line.name, opts.x + colWidths[0] + 6, y + 5, { width: colWidths[1] - 12 })
    doc.text(formatNumber(line.total), opts.x + colWidths[0] + colWidths[1], y + 5, { width: colWidths[2] - 6, align: 'right' })

    y += rowHeight

    doc
      .moveTo(opts.x, y)
      .lineTo(opts.x + opts.width, y)
      .strokeColor('#e6e6e6')
      .stroke()
  })

  // ── TOTAL DE SECCIÓN
  y += 6

  doc.rect(opts.x, y - 4, opts.width, rowHeight).fill('#fafafa')
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000')

  doc.text(`Total ${translateSection(section.name)}`, opts.x + colWidths[0], y + 6, {
    width: colWidths[1],
    align: 'right',
  })

  doc.text(formatNumber(section.total), opts.x + colWidths[0] + colWidths[1], y + 6, {
    width: colWidths[2] - 6,
    align: 'right',
  })

  doc.font('Helvetica').fillColor('#000')

  return y + rowHeight
}

// ─────────────────────────────────────────────────────
// GENERADOR PDF
// ─────────────────────────────────────────────────────
export const pdfkitReportPdfGenerator = (): ReportPdfGenerator => ({
  async generateIncomeStatement(model: IncomeStatementPdfModel): Promise<GeneratedPdf> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = doc as unknown as NodeJS.ReadableStream

    // ── ENCABEZADO
    doc.font('Helvetica-Bold').fontSize(16)
    doc.text('Estado de Resultados', { align: 'center' })

    doc.font('Helvetica').fontSize(11)
    doc.text(`Período ${model.period.start} - ${model.period.end}`, { align: 'center' })

    if (model.description) {
      doc.moveDown(0.4)
      doc.fontSize(9).text(model.description, { align: 'center' })
    }

    doc.moveDown(1.2)

    // ── SECCIONES
    let currentY = doc.y
    const x = doc.x
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right

    model.sections.forEach((section, index) => {
      if (currentY + 200 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage()
        currentY = doc.page.margins.top
      }

      currentY = drawSectionTable(doc, section, {
        x,
        y: currentY,
        width,
      })

      doc.y = currentY + 10

      if (index < model.sections.length - 1) {
        doc
          .moveTo(x, doc.y)
          .lineTo(x + width, doc.y)
          .strokeColor('#cccccc')
          .stroke()

        doc.moveDown(0.6)
        currentY = doc.y
      }
    })

    // ── RESUMEN
    doc.moveDown(1.5)

    const net = model.totals.netIncome ?? model.totals.incomeBeforeTaxes

    const summaryX = x + width * 0.55
    const summaryWidth = width * 0.45

    doc.font('Helvetica-Bold').fontSize(11)
    doc.text('Resumen', summaryX, doc.y)

    doc.moveDown(0.4)
    doc.font('Helvetica').fontSize(10)

    const summaryLine = (label: string, value: number) => {
      const y = doc.y
      doc.text(label, summaryX, y, { width: summaryWidth - 80 })
      doc.text(formatNumber(value), summaryX + summaryWidth - 80, y, { width: 80, align: 'right' })
      doc.moveDown(0.4)
    }

    summaryLine('Utilidad Bruta', model.totals.grossProfit)
    summaryLine('Utilidad Operativa', model.totals.operatingIncome)
    summaryLine('Utilidad Antes de Impuestos', model.totals.incomeBeforeTaxes)

    doc.font('Helvetica-Bold')
    summaryLine('Utilidad Neta', net)
    doc.font('Helvetica')

    // ── FOOTER
    doc.moveDown(1.2)
    doc.fontSize(8).fillColor('#555')
    doc.text(`Generado: ${formatDateTime(model.generatedAt)}`, {
      align: 'right',
    })

    doc.end()

    return {
      filename: `estado-resultados-${model.period.start}-${model.period.end}.pdf`,
      stream,
    }
  },
})
