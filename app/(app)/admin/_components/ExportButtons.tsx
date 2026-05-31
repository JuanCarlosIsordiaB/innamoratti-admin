'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import type { ExportData } from '@/lib/export-utils'

interface Props {
  data: ExportData
  filename: string
}

export default function ExportButtons({ data, filename }: Props) {
  const [loadingPDF, setLoadingPDF] = useState(false)
  const [loadingXLSX, setLoadingXLSX] = useState(false)

  async function handlePDF() {
    setLoadingPDF(true)
    try {
      const { exportToPDF } = await import('@/lib/export-utils')
      await exportToPDF(data, `${filename}.pdf`)
    } finally {
      setLoadingPDF(false)
    }
  }

  async function handleExcel() {
    setLoadingXLSX(true)
    try {
      const { exportToExcel } = await import('@/lib/export-utils')
      await exportToExcel(data, `${filename}.xlsx`)
    } finally {
      setLoadingXLSX(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePDF}
        disabled={loadingPDF}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileDown size={14} strokeWidth={1.5} />
        {loadingPDF ? 'Generando...' : 'PDF'}
      </button>
      <button
        onClick={handleExcel}
        disabled={loadingXLSX}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileDown size={14} strokeWidth={1.5} />
        {loadingXLSX ? 'Generando...' : 'Excel'}
      </button>
    </div>
  )
}
