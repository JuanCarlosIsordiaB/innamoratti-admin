export interface ExportChecklistItem {
  label: string
  is_completed: boolean
  completed_at: string | null
  note: string | null
}

export interface ExportCashDetails {
  denom_1000: number
  denom_500: number
  denom_200: number
  denom_100: number
  denom_50: number
  denom_20: number
  denom_10: number
  denom_5: number
  denom_1: number
  total_counted: number
  fund_amount: number
  sales_amount: number
  digital_signature: string
}

export interface ExportChecklist {
  area_id: string
  areaLabel: string
  date: string
  status: 'in_progress' | 'completed'
  userName: string
  checklist_items: ExportChecklistItem[]
  cashDetails: ExportCashDetails | null
}

export interface ExportData {
  date: string
  selectedArea: string | null
  checklists: ExportChecklist[]
}

function fmtTime(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export async function exportToPDF(data: ExportData, filename: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = (doc as any).internal
  const pageWidth: number = internal.pageSize.getWidth()
  const pageHeight: number = internal.pageSize.getHeight()
  const margin = 15

  // ── Header ──────────────────────────────────────────────────
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(122, 17, 13)
  doc.text('INNAMORATTI', margin, 22)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Reporte de Checklists', margin, 29)

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(margin, 33, pageWidth - margin, 33)

  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text(`Fecha: ${fmtDate(data.date)}`, margin, 39)

  let headerEndY = 39
  if (data.selectedArea) {
    const match = data.checklists.find((c) => c.area_id === data.selectedArea)
    doc.text(`Área: ${match?.areaLabel ?? data.selectedArea}`, margin, 44)
    headerEndY = 44
  }

  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, margin, headerEndY + 5)

  let cursorY = headerEndY + 12

  // ── Per-checklist sections ───────────────────────────────────
  for (const cl of data.checklists) {
    if (cursorY > 262) { doc.addPage(); cursorY = 15 }

    const done = cl.checklist_items.filter((i) => i.is_completed).length
    const total = cl.checklist_items.length
    const statusLabel = cl.status === 'completed' ? 'Completado' : 'En progreso'

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(cl.areaLabel.toUpperCase(), margin, cursorY + 6)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(`${cl.userName}  ·  ${done}/${total} tareas  ·  ${statusLabel}`, margin, cursorY + 11)

    autoTable(doc, {
      startY: cursorY + 14,
      margin: { left: margin, right: margin },
      head: [['Tarea', 'Hecho', 'Hora', 'Nota']],
      body: cl.checklist_items.map((item) => [
        item.label,
        item.is_completed ? 'Si' : 'No',
        fmtTime(item.completed_at),
        item.note ?? '',
      ]),
      headStyles: { fillColor: [122, 17, 13], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 12 },
        2: { halign: 'center', cellWidth: 20 },
        3: { cellWidth: 38 },
      },
      styles: { lineColor: [226, 232, 240], lineWidth: 0.1, overflow: 'linebreak' },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 6

    if (cl.cashDetails) {
      const cash = cl.cashDetails
      const denoms = [1000, 500, 200, 100, 50, 20, 10, 5, 1] as const

      const denomRows = denoms
        .filter((d) => (cash[`denom_${d}` as keyof ExportCashDetails] as number) > 0)
        .map((d) => {
          const count = cash[`denom_${d}` as keyof ExportCashDetails] as number
          return [`$${d.toLocaleString()}`, count.toString(), `$${(d * count).toLocaleString()}`]
        })

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text('DETALLE DE CORTE DE CAJA', margin, cursorY + 4)

      autoTable(doc, {
        startY: cursorY + 7,
        margin: { left: margin, right: margin },
        head: [['Denominación', 'Cantidad', 'Subtotal']],
        body: [
          ...denomRows,
          [{ content: 'Total contado', styles: { fontStyle: 'bold' } }, '', `$${Number(cash.total_counted).toLocaleString()}`],
          ['Ventas del día', '', `$${Number(cash.sales_amount).toLocaleString()}`],
          ['Fondo de caja', '', `$${Number(cash.fund_amount).toLocaleString()}`],
          ['Firma digital', '', cash.digital_signature],
        ],
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: 'center', cellWidth: 25 },
          2: { halign: 'right', cellWidth: 40 },
        },
        styles: { lineColor: [226, 232, 240], lineWidth: 0.1 },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cursorY = (doc as any).lastAutoTable.finalY + 6
    }

    cursorY += 5
  }

  // ── Footer on every page ────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Innamoratti Control  ·  Página ${p} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' },
    )
  }

  doc.save(filename)
}

export async function exportToExcel(data: ExportData, filename: string): Promise<void> {
  const XLSX = await import('xlsx')

  // ── Sheet 1: Checklists ──────────────────────────────────────
  const rows = data.checklists.flatMap((cl) => {
    if (cl.checklist_items.length === 0) {
      return [{
        Fecha: cl.date,
        Área: cl.areaLabel,
        Usuario: cl.userName,
        Estado: cl.status === 'completed' ? 'Completado' : 'En progreso',
        Tarea: '',
        Completada: '',
        Hora: '',
        Nota: '',
      }]
    }
    return cl.checklist_items.map((item) => ({
      Fecha: cl.date,
      Área: cl.areaLabel,
      Usuario: cl.userName,
      Estado: cl.status === 'completed' ? 'Completado' : 'En progreso',
      Tarea: item.label,
      Completada: item.is_completed ? 'Sí' : 'No',
      Hora: fmtTime(item.completed_at),
      Nota: item.note ?? '',
    }))
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 }, { wch: 28 }, { wch: 20 }, { wch: 14 },
    { wch: 50 }, { wch: 12 }, { wch: 10 }, { wch: 30 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Checklists')

  // ── Sheet 2: Corte de Caja (if any) ─────────────────────────
  const cashRows = data.checklists
    .filter((cl) => cl.cashDetails !== null)
    .map((cl) => {
      const cash = cl.cashDetails!
      return {
        Fecha: cl.date,
        Área: cl.areaLabel,
        Usuario: cl.userName,
        '$1000': cash.denom_1000,
        '$500': cash.denom_500,
        '$200': cash.denom_200,
        '$100': cash.denom_100,
        '$50': cash.denom_50,
        '$20': cash.denom_20,
        '$10': cash.denom_10,
        '$5': cash.denom_5,
        '$1': cash.denom_1,
        'Total Contado': cash.total_counted,
        Ventas: cash.sales_amount,
        Fondo: cash.fund_amount,
        Firma: cash.digital_signature,
      }
    })

  if (cashRows.length > 0) {
    const cashWs = XLSX.utils.json_to_sheet(cashRows)
    cashWs['!cols'] = [
      { wch: 12 }, { wch: 28 }, { wch: 20 },
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
      { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
    ]
    XLSX.utils.book_append_sheet(wb, cashWs, 'Corte de Caja')
  }

  XLSX.writeFile(wb, filename)
}
