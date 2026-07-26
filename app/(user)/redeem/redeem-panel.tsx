// app/(user)/redeem/redeem-panel.tsx
'use client'

import { useState } from 'react'

type Reward = {
  id: string
  title: string
  type: string
  points_cost: number
  value_kes: number
}

export default function RedeemPanel({
  rewards,
  currentPoints,
}: {
  rewards: Reward[]
  currentPoints: number
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedReward = rewards.find((r) => r.id === selectedId) ?? null
  const canAfford = selectedReward ? currentPoints >= selectedReward.points_cost : false

  async function handleRedeem() {
    if (!selectedReward) return

    if (!phoneNumber.trim()) {
      setError('Enter the phone number to send airtime to.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/redeem/airtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: selectedReward.id, phoneNumber: phoneNumber.trim() }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? 'Redemption failed. Please try again.')
        setLoading(false)
        return
      }

      setSuccess(data.message ?? 'Airtime sent successfully.')
      setLoading(false)
    } catch {
      setError('Could not reach the server. Please try again.')
      setLoading(false)
    }
  }

  if (rewards.length === 0) {
    return (
      <div className="card-strong">
        <p className="text-sm text-white/70">No rewards available right now.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Airtime Rewards
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {rewards.map((reward) => {
          const isSelected = reward.id === selectedId
          const affordable = currentPoints >= reward.points_cost
          return (
            <button
              key={reward.id}
              type="button"
              onClick={() => {
                setSelectedId(reward.id)
                setError(null)
                setSuccess(null)
              }}
              disabled={!affordable}
              className="profile-status-chip"
              style={{
                textAlign: 'left',
                borderWidth: isSelected ? '2px' : '1px',
                borderColor: isSelected ? 'var(--color-accent, #2f7d4f)' : undefined,
                cursor: affordable ? 'pointer' : 'not-allowed',
                opacity: affordable ? 1 : 0.5,
              }}
            >
              <p className="profile-status-lbl">{reward.title}</p>
              <p className="profile-status-num">{reward.points_cost.toLocaleString()} pts</p>
              <p className="text-xs text-gray-400 mt-1">
                {affordable ? 'Available' : 'Not enough points'}
              </p>
            </button>
          )
        })}
      </div>

      {selectedReward && (
        <div className="mt-4">
          <label className="input-label">Phone number for airtime</label>
          <input
            type="tel"
            className="input"
            placeholder="+254700000000"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 mt-3">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3 mt-3">
          {success}
        </p>
      )}

      <button
        type="button"
        onClick={handleRedeem}
        disabled={loading || !selectedReward || !canAfford}
        className="btn btn-ghost w-full mt-4"
      >
        {loading ? 'Sending airtime…' : 'Redeem Airtime'}
      </button>
// Add this inside RedeemPanel, after the real reward cards grid, before the phone input section

<div className="mt-4">
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
    Coming Soon
  </p>
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <div
      className="profile-status-chip"
      style={{ opacity: 0.5, cursor: 'not-allowed' }}
    >
      <p className="profile-status-lbl">Gift Cards</p>
      <p className="text-xs text-gray-400 mt-1">Redeem points for retail gift cards</p>
    </div>
    <div
      className="profile-status-chip"
      style={{ opacity: 0.5, cursor: 'not-allowed' }}
    >
      <p className="profile-status-lbl">Donate to a Cause</p>
      <p className="text-xs text-gray-400 mt-1">Convert points into a real donation</p>
    </div>
  </div>
</div>
      
    </div>
  )
}