// app/organization/wallet/buy-points-panel.tsx
'use client'

import { useState } from 'react'

type Package = {
  id: string
  name: string
  points: number
  price_kes: number
}

export default function BuyPointsPanel({ packages }: { packages: Package[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(packages[0]?.id ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBuy() {
    if (!selectedId) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/pesapal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedId }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      window.location.href = data.redirect_url
    } catch {
      setError('Could not reach the payment provider. Please try again.')
      setLoading(false)
    }
  }

  if (packages.length === 0) {
    return (
      <div className="card-strong">
        <p className="text-sm text-white/70">No point packages available right now.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Buy Points
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {packages.map((pkg) => {
          const isSelected = pkg.id === selectedId
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelectedId(pkg.id)}
              className="profile-status-chip"
              style={{
                textAlign: 'left',
                borderWidth: isSelected ? '2px' : '1px',
                borderColor: isSelected ? 'var(--color-accent, #2f7d4f)' : undefined,
                cursor: 'pointer',
              }}
            >
              <p className="profile-status-lbl">{pkg.name}</p>
              <p className="profile-status-num">{pkg.points.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">KES {pkg.price_kes.toLocaleString()}</p>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 mt-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleBuy}
        disabled={loading || !selectedId}
        className="btn btn-ghost w-full mt-4"
      >
        {loading ? 'Redirecting to payment…' : 'Buy Points'}
      </button>
    </div>
  )
}