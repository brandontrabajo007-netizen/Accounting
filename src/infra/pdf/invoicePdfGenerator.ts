import PDFDocument from 'pdfkit'

export type InvoicePdfItem = {
  description: string
  qty: number
  unitPrice: number
  lineTotal: number
}

export type InvoicePdfModel = {
  companyId?: string | null
  companyName?: string | null
  customerName?: string | null
  customerDocumentNumber?: string | null
  customerPhone?: string | null
  customerCity?: string | null
  customerAddress?: string | null
  date: string
  paymentMethod?: string | null
  creditDueDate?: string | null
  totalAmount: number
  downPaymentAmount?: number | null
  showCreditBreakdown?: boolean
  items: InvoicePdfItem[]
  sellerSignatureDataUrl?: string | null
  sellerSignatureLabel?: string | null
  sellerSignedAt?: string | null
  customerSignatureDataUrl?: string | null
  customerSignatureLabel?: string | null
  customerSignedAt?: string | null
}

const decodeImageDataUrl = (value?: string | null): Buffer | null => {
  if (!value || typeof value !== 'string') return null
  const match = value.match(/^data:image\/(?:png|jpeg|jpg);base64,(.+)$/i)
  if (!match?.[1]) return null
  try {
    return Buffer.from(match[1], 'base64')
  } catch {
    return null
  }
}

const formatCurrency = (value: number) =>
  value.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })

export const generateInvoicePdfBuffer = (model: InvoicePdfModel): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      const pageWidth = doc.page?.width ?? 595.28
      const marginLeft = doc.page?.margins?.left ?? 50
      const marginRight = doc.page?.margins?.right ?? 50
      const contentWidth = pageWidth - marginLeft - marginRight
      const headerHeight = 90

      doc.save()
      doc.rect(0, 0, pageWidth, headerHeight).fill('#f3f5f7')
      doc.restore()

      doc.fillColor('#1f2933').font('Helvetica-Bold').fontSize(20).text('Factura de venta', marginLeft, 28, {
        width: contentWidth,
        align: 'left',
      })

      if (model.companyId) {
        doc.fillColor('#52606d').font('Helvetica').fontSize(10).text(`Empresa: ${model.companyId}`, marginLeft, 52, {
          width: contentWidth,
          align: 'left',
        })
      }

      if (model.companyName) {
        doc.fillColor('#52606d').font('Helvetica').fontSize(10).text(model.companyName, marginLeft, 66, {
          width: contentWidth,
          align: 'left',
        })
      }

      doc.fillColor('#1f2933')
      doc.y = headerHeight + 12

      const infoBoxTop = doc.y
      const infoBoxHeight = 116
      doc.save()
      const roundedRect = (doc as unknown as { roundedRect?: (...args: number[]) => PDFKit.PDFDocument }).roundedRect
      if (typeof roundedRect === 'function') {
        roundedRect.call(doc, marginLeft, infoBoxTop, contentWidth, infoBoxHeight, 6).stroke('#d9e2ec')
      } else {
        doc.rect(marginLeft, infoBoxTop, contentWidth, infoBoxHeight).stroke('#d9e2ec')
      }
      doc.restore()

      const infoLeftX = marginLeft + 12
      const infoRightX = marginLeft + Math.round(contentWidth / 2) + 12
      const infoTopY = infoBoxTop + 12
      const labelValueGap = 12
      const rowGap = 24

      doc.font('Helvetica').fontSize(10).fillColor('#52606d').text('Fecha', infoLeftX, infoTopY)
      doc.fillColor('#1f2933').text(model.date, infoLeftX, infoTopY + labelValueGap)

      doc.fillColor('#52606d').text('Cliente', infoLeftX, infoTopY + rowGap)
      doc.fillColor('#1f2933').text(model.customerName ?? 'sin cliente', infoLeftX, infoTopY + rowGap + labelValueGap, {
        width: Math.round(contentWidth / 2) - 20,
      })

      doc.fillColor('#52606d').text('Cedula', infoLeftX, infoTopY + rowGap * 2)
      doc.fillColor('#1f2933').text(model.customerDocumentNumber ?? 'sin dato', infoLeftX, infoTopY + rowGap * 2 + labelValueGap, {
        width: Math.round(contentWidth / 2) - 20,
      })

      doc.fillColor('#52606d').text('Telefono', infoLeftX, infoTopY + rowGap * 3)
      doc.fillColor('#1f2933').text(model.customerPhone ?? 'sin dato', infoLeftX, infoTopY + rowGap * 3 + labelValueGap, {
        width: Math.round(contentWidth / 2) - 20,
      })

      doc.fillColor('#52606d').text('Pago', infoRightX, infoTopY)
      doc.fillColor('#1f2933').text(model.paymentMethod ?? 'sin dato', infoRightX, infoTopY + labelValueGap, {
        width: Math.round(contentWidth / 2) - 20,
      })

      doc.fillColor('#52606d').text('Fecha de pago', infoRightX, infoTopY + rowGap)
      doc.fillColor('#1f2933').text(model.creditDueDate ?? 'sin dato', infoRightX, infoTopY + rowGap + labelValueGap)

      doc.fillColor('#52606d').text('Ciudad', infoRightX, infoTopY + rowGap * 2)
      doc.fillColor('#1f2933').text(model.customerCity ?? 'sin dato', infoRightX, infoTopY + rowGap * 2 + labelValueGap, {
        width: Math.round(contentWidth / 2) - 20,
      })

      doc.fillColor('#52606d').text('Direccion', infoRightX, infoTopY + rowGap * 3)
      doc.fillColor('#1f2933').text(model.customerAddress ?? 'sin dato', infoRightX, infoTopY + rowGap * 3 + labelValueGap, {
        width: Math.round(contentWidth / 2) - 20,
      })
      doc.moveDown(4)
      doc.fillColor('#1f2933').font('Helvetica-Bold').fontSize(11).text('Detalle de la venta')
      doc.moveDown(0.5)

      const tableStartX = marginLeft
      const colQtyWidth = 50
      const colUnitWidth = 90
      const colTotalWidth = 90
      const colDescriptionWidth = contentWidth - colQtyWidth - colUnitWidth - colTotalWidth

      const colDescriptionX = tableStartX
      const colQtyX = colDescriptionX + colDescriptionWidth
      const colUnitX = colQtyX + colQtyWidth
      const colTotalX = colUnitX + colUnitWidth

      const drawTableHeader = () => {
        const headerY = doc.y
        doc.save()
        doc.rect(tableStartX, headerY, contentWidth, 20).fill('#e6e9ef')
        doc.restore()
        doc.fillColor('#1f2933').font('Helvetica-Bold').fontSize(10)
        doc.text('Producto / Variante', colDescriptionX + 4, headerY + 5, { width: colDescriptionWidth - 8 })
        doc.text('Cant.', colQtyX + 4, headerY + 5, { width: colQtyWidth - 8 })
        doc.text('Unitario', colUnitX + 4, headerY + 5, { width: colUnitWidth - 8 })
        doc.text('Total', colTotalX + 4, headerY + 5, { width: colTotalWidth - 8 })
        doc.moveDown(1.3)
      }

      drawTableHeader()

      doc.font('Helvetica').fontSize(10).fillColor('#1f2933')
      model.items.forEach((item) => {
        const rowHeight = Math.max(14, doc.heightOfString(item.description, { width: colDescriptionWidth - 8 })) + 6
        const bottomLimit = (doc.page?.height ?? 841.89) - (doc.page?.margins?.bottom ?? 50) - 60
        if (doc.y + rowHeight > bottomLimit) {
          doc.addPage()
          doc.moveDown(1)
          drawTableHeader()
        }

        const lineY = doc.y
        doc.text(item.description, colDescriptionX + 4, lineY, { width: colDescriptionWidth - 8 })
        doc.text(String(item.qty), colQtyX + 4, lineY, { width: colQtyWidth - 8 })
        doc.text(formatCurrency(item.unitPrice), colUnitX + 4, lineY, { width: colUnitWidth - 8 })
        doc.text(formatCurrency(item.lineTotal), colTotalX + 4, lineY, { width: colTotalWidth - 8 })
        doc.moveDown(0.8)
      })

      const downPaymentAmount = Math.max(0, Math.round(Number(model.downPaymentAmount ?? 0)))
      const pendingAmount = Math.max(0, Math.round(Number(model.totalAmount ?? 0) - downPaymentAmount))
      const showCreditBreakdown = Boolean(model.showCreditBreakdown)

      doc.moveDown(0.8)
      doc.moveTo(marginLeft, doc.y).lineTo(marginLeft + contentWidth, doc.y).stroke('#d9e2ec')
      doc.moveDown(0.6)
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1f2933').text(`Total: ${formatCurrency(model.totalAmount)}`, { align: 'right' })
      if (showCreditBreakdown) {
        doc.font('Helvetica').fontSize(10).fillColor('#334e68').text(`Abono: ${formatCurrency(downPaymentAmount)}`, { align: 'right' })
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1f2933').text(`Saldo pendiente: ${formatCurrency(pendingAmount)}`, { align: 'right' })
      }

      const signatureSectionHeight = 132
      const bottomLimit = (doc.page?.height ?? 841.89) - (doc.page?.margins?.bottom ?? 50)
      if (doc.y + signatureSectionHeight > bottomLimit) {
        doc.addPage()
      }

      doc.moveDown(1.2)
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1f2933').text('Firmas', marginLeft, doc.y, {
        width: contentWidth,
        align: 'left',
      })
      doc.moveDown(0.4)

      const boxTop = doc.y
      const gap = 16
      const boxWidth = Math.floor((contentWidth - gap) / 2)
      const boxHeight = 96
      const sellerX = marginLeft
      const customerX = marginLeft + boxWidth + gap

      const renderSignatureBox = (params: {
        x: number
        title: string
        label: string
        signedAt?: string | null
        imageDataUrl?: string | null
      }) => {
        doc.save()
        doc.rect(params.x, boxTop, boxWidth, boxHeight).stroke('#d9e2ec')
        doc.restore()
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#334e68').text(params.title, params.x + 8, boxTop + 6)

        const imageBuffer = decodeImageDataUrl(params.imageDataUrl)
        if (imageBuffer) {
          try {
            doc.image(imageBuffer, params.x + 8, boxTop + 22, {
              fit: [boxWidth - 16, 42],
              align: 'center',
              valign: 'center',
            })
          } catch {
            doc.font('Helvetica').fontSize(8).fillColor('#7b8794').text('Firma no disponible', params.x + 8, boxTop + 40)
          }
        } else {
          doc.font('Helvetica').fontSize(8).fillColor('#7b8794').text('Firma pendiente', params.x + 8, boxTop + 40)
        }

        doc.font('Helvetica').fontSize(8).fillColor('#486581').text(params.label, params.x + 8, boxTop + boxHeight - 24, {
          width: boxWidth - 16,
        })
        if (params.signedAt) {
          doc.font('Helvetica').fontSize(7).fillColor('#829ab1').text(params.signedAt, params.x + 8, boxTop + boxHeight - 12, {
            width: boxWidth - 16,
          })
        }
      }

      renderSignatureBox({
        x: sellerX,
        title: 'Vendedor',
        label: model.sellerSignatureLabel ?? 'Sin dato',
        signedAt: model.sellerSignedAt ?? null,
        imageDataUrl: model.sellerSignatureDataUrl ?? null,
      })

      renderSignatureBox({
        x: customerX,
        title: 'Cliente',
        label: model.customerSignatureLabel ?? (model.customerName ?? 'Sin dato'),
        signedAt: model.customerSignedAt ?? null,
        imageDataUrl: model.customerSignatureDataUrl ?? null,
      })

      doc.end()
    } catch (error) {
      console.error('Error generando PDF de factura:', error)
      reject(error)
    }
  })
}
