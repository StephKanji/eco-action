'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Package = {
  id: string
  name: string
  points: number
  price_kes: number
}

const POLL_INTERVAL_MS = 5000
const POLL_TIMEOUT_MS  = 120000

export default function BuyPointsPanel({ packages }: { packages: Package[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(packages[0]?.id ?? null)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'waiting' | 'confirmed' | 'timeout'>('idle')
  const [confirmedPoints, setConfirmedPoints] = useState<number | null>(null)

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  function stopPolling() {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (pollTimeoutRef.current)  clearTimeout(pollTimeoutRef.current)
  }

  useEffect(() => () => stopPolling(), [])

  function startPolling(checkoutRequestId: string) {
    setStatus('waiting')
    const confirmedRef = { current: false }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/daraja/status?checkoutRequestId=${checkoutRequestId}`)
        const data = await res.json()

        if (data.status === 'completed') {
          confirmedRef.current = true
          stopPolling()
          setConfirmedPoints(data.points)
          setStatus('confirmed')
          router.refresh()
        } else if (data.status === 'failed') {
          stopPolling()
          setStatus('idle')
          setError('Payment was not completed. Please try again.')
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS)

    pollTimeoutRef.current = setTimeout(() => {
      stopPolling()
      if (!confirmedRef.current) setStatus('timeout')
    }, POLL_TIMEOUT_MS)
  }

  async function handleBuy() {
    if (!selectedId) return
    if (!phone.trim()) {
      setError('Please enter your M-Pesa phone number.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/daraja/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedId, phone: phone.trim() }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to send M-Pesa prompt. Please try again.')
        return
      }

      // Dev only: simulate callback since sandbox won't reach localhost
      if (process.env.NODE_ENV === 'development') {
        await fetch('/api/daraja/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestId: data.checkoutRequestId }),
        })
      }

      startPolling(data.checkoutRequestId)
    } catch {
      setError('Could not reach the payment provider. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    stopPolling()
    setStatus('idle')
    setError(null)
    setConfirmedPoints(null)
  }

  const selectedPkg = packages.find((p) => p.id === selectedId)

  if (packages.length === 0) {
    return (
      <div className="card-strong">
        <p className="text-sm text-white/70">No point packages available right now.</p>
      </div>
    )
  }

  /* ── Confirmed ─────────────────────────────────────────── */
  if (status === 'confirmed') {
    return (
      <div className="space-y-4">
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(82,183,136,0.12) 0%, rgba(45,106,79,0.08) 100%)',
            border: '1px solid rgba(82,183,136,0.3)',
            borderRadius: 'var(--radius-2xl)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>✅</span>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
              Payment confirmed!
            </p>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
            <span style={{ fontWeight: 700, color: 'var(--green-mid)' }}>
              {confirmedPoints?.toLocaleString()} points
            </span>{' '}
            have been added to your wallet.
          </p>
        </div>
        <button type="button" onClick={handleReset} className="btn btn-ghost w-full">
          Buy More Points
        </button>
      </div>
    )
  }

  /* ── Waiting ───────────────────────────────────────────── */
  if (status === 'waiting') {
    return (
      <div className="space-y-4">
        <div
          style={{
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid var(--cream-border)',
            borderRadius: 'var(--radius-2xl)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>📱</span>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
              Waiting for payment…
            </p>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Enter your M-Pesa PIN on your phone. Your balance will update automatically once confirmed.
          </p>

          {/* Pulsing indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--green-bright)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <p className="profile-status-lbl" style={{ margin: 0 }}>
              Checking for confirmation every 5 seconds…
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { stopPolling(); setStatus('idle') }}
          className="text-xs text-center w-full"
          style={{ color: 'var(--color-text-subtle)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: '4px' }}
        >
          Cancel
        </button>
      </div>
    )
  }

  /* ── Timeout ───────────────────────────────────────────── */
  if (status === 'timeout') {
    return (
      <div className="space-y-4">
        <div
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 'var(--radius-2xl)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>⏱</span>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gold)', margin: 0 }}>
              Taking longer than expected
            </p>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
            If you completed the payment, your points will appear after refreshing.
          </p>
        </div>

        <button type="button" onClick={() => router.refresh()} className="btn btn-ghost w-full">
          Refresh Balance
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-center w-full"
          style={{ color: 'var(--color-text-subtle)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: '4px' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  /* ── Idle (default) ────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* Section label */}
      <p className="org-section-label">Buy Points</p>

      {/* Package grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {packages.map((pkg) => {
          const isSelected = pkg.id === selectedId
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => { setSelectedId(pkg.id); setError(null) }}
              style={{
                textAlign: 'left',
                borderRadius: 'var(--radius-2xl)',
                padding: '16px',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(82,183,136,0.14) 0%, rgba(45,106,79,0.08) 100%)'
                  : 'white',
                border: isSelected
                  ? '2px solid var(--green-bright)'
                  : '1px solid var(--cream-border)',
                boxShadow: isSelected ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                {pkg.name}
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1, marginBottom: '6px' }}>
                {pkg.points.toLocaleString()}
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '4px' }}>pts</span>
              </p>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--green-mid)' : 'var(--color-text-muted)' }}>
                KES {pkg.price_kes.toLocaleString()}
              </p>
            </button>
          )
        })}
      </div>

      {/* Phone input */}
      <div>
        <label
          htmlFor="mpesa-phone"
          className="org-section-label"
          style={{ display: 'block', marginBottom: '6px' }}
        >
          M-Pesa Phone Number
        </label>
        <input
          id="mpesa-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0712 345 678"
          style={{
            width: '100%',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--cream-border)',
            background: 'white',
            padding: '10px 14px',
            fontSize: '0.9rem',
            color: 'var(--color-text)',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            boxShadow: 'var(--shadow-sm)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--green-bright)'
            e.target.style.boxShadow = '0 0 0 3px rgba(82,183,136,0.15)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--cream-border)'
            e.target.style.boxShadow = 'var(--shadow-sm)'
          }}
        />
      </div>

      {/* Summary line */}
      {selectedPkg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(82,183,136,0.07)',
            border: '1px solid rgba(82,183,136,0.15)',
          }}
        >
          <span style={{ fontSize: '1rem' }}>🌿</span>
          <p style={{ fontSize: '0.82rem', color: 'var(--green-mid)', margin: 0 }}>
            You will receive{' '}
            <strong>{selectedPkg.points.toLocaleString()} pts</strong> for{' '}
            <strong>KES {selectedPkg.price_kes.toLocaleString()}</strong> via M-Pesa.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--terracotta)',
            background: 'rgba(122,44,5,0.07)',
            border: '1px solid rgba(122,44,5,0.15)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 14px',
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleBuy}
        disabled={loading || !selectedId}
        className="btn btn-ghost w-full"
        style={{ marginTop: '4px' }}
      >
        {loading ? 'Sending M-Pesa prompt…' : '📱 Pay with M-Pesa'}
      </button>
    </div>
  )
}
