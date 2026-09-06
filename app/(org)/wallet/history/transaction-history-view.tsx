'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Transaction = {
  id: string
  created_at: string
  type: string
  amount: number
  from_entity_name: string | null
  to_entity_name: string | null
  notes: string | null
}

const TYPE_STYLES: Record<string, { label: string; color: string }> = {
  purchase: { label: 'Purchase', color: 'bg-green-100 text-green-700' },
  starter_grant: { label: 'Starter Grant', color: 'bg-blue-100 text-blue-700' },
  escrow_lock: { label: 'Locked for tasks', color: 'bg-yellow-100 text-yellow-700' },
  escrow_release: { label: 'Release for tasks', color: 'bg-green-100 text-green-700' },
  escrow_return: { label: 'Escrow Return', color: 'bg-gray-100 text-gray-700' },
  reward_credit: { label: 'Reward Credit', color: 'bg-green-100 text-green-700' },
  redemption: { label: 'Redemption', color: 'bg-red-100 text-red-700' },
}

export default function TransactionHistoryView({ transactions }: { transactions: Transaction[] }) {
  const [filter, setFilter] = useState<string>('all')
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const downloadMenuRef = useRef<HTMLDivElement>(null)

  const allTypes = Object.keys(TYPE_STYLES)

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter((t) => t.type === filter)
  }, [transactions, filter])

  // Close the download menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function downloadCSV() {
    const headers = ['Date', 'Type', 'From', 'To', 'Amount', 'Notes']
    const rows = filtered.map((t) => [
      new Date(t.created_at).toLocaleString('en-KE'),
      TYPE_STYLES[t.type]?.label ?? t.type,
      t.from_entity_name ?? '',
      t.to_entity_name ?? '',
      String(t.amount),
      (t.notes ?? '').replace(/"/g, '""'),
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transaction-history-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
function downloadPDF() {
  const doc = new jsPDF()
  doc.text('Transaction History', 14, 15)

  autoTable(doc, {
    startY: 22,
    head: [['Date', 'Type', 'From', 'To', 'Amount', 'Notes']],
    body: filtered.map((t) => [
      new Date(t.created_at).toLocaleString(),
      TYPE_STYLES[t.type]?.label ?? t.type,
      t.from_entity_name ?? '—',
      t.to_entity_name ?? '—',
      t.amount.toLocaleString(),
      t.notes ?? '',
    ]),
    styles: { fontSize: 8 },
  })

  doc.save(`transaction-history-${new Date().toISOString().slice(0, 10)}.pdf`)
}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">All ({transactions.length})</option>
          {allTypes.map((t) => (
            <option key={t} value={t}>
              {TYPE_STYLES[t].label} ({transactions.filter((x) => x.type === t).length})
            </option>
          ))}
        </select>

        <div className="relative" ref={downloadMenuRef}>
          <button
            type="button"
            onClick={() => setDownloadMenuOpen((prev) => !prev)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full bg-gray-800 text-white
                       hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Download
            <ChevronDown size={14} className={`transition-transform ${downloadMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {downloadMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-36 rounded-xl bg-white
                         overflow-hidden z-10"
            >
              <button
                type="button"
                onClick={() => { downloadCSV(); setDownloadMenuOpen(false) }}
                className="w-full text-left text-xs font-medium px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Download CSV
              </button>
              <button
                type="button"
                onClick={() => { downloadPDF(); setDownloadMenuOpen(false) }}
                className="w-full text-left text-xs font-medium px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors no-print"
              >
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">No transactions match this filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">From</th>
                <th className="py-2 pr-4">To</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const style = TYPE_STYLES[tx.type] ?? { label: tx.type, color: 'bg-gray-100 text-gray-700' }
                return (
                  <tr key={tx.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString('en-KE')}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.color}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-700">{tx.from_entity_name ?? '—'}</td>
                    <td className="py-2 pr-4 text-gray-700">{tx.to_entity_name ?? '—'}</td>
                    <td className="py-2 pr-4 font-semibold text-gray-900">{tx.amount.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-xs text-gray-400 max-w-xs truncate">{tx.notes}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}