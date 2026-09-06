'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ReviewButtonProps {
  submissionId: string
  orgId: string
}

export function ApproveButton({ submissionId, orgId }: ReviewButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handle() {
    setLoading(true)
    const res = await fetch('/api/tasks/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: submissionId,
        action: 'approve',
        org_id: orgId,
      }),
    })
    if (res.ok) router.refresh()
    else {
      const data = await res.json()
      alert(data.error ?? 'Failed to approve')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="w-full py-2.5 rounded-xl bg-green-50 text-green-600 border border-green-200 text-sm 
                 font-semibold hover:bg-green-100 transition-colors
                 disabled:opacity-50"
    >
      {loading ? 'Approving...' : '✅ Approve'}
    </button>
  )
}

export function RejectButton({ submissionId, orgId }: ReviewButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showReason, setShowReason] = useState(false)
  const [reason, setReason] = useState('')
  const router = useRouter()

  async function handle() {
    setLoading(true)
    const res = await fetch('/api/tasks/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: submissionId,
        action: 'reject',
        org_id: orgId,
        rejection_reason: reason,
      }),
    })
    if (res.ok) router.refresh()
    else {
      const data = await res.json()
      alert(data.error ?? 'Failed to reject')
    }
    setLoading(false)
    setShowReason(false)
  }

  return (
    <div className="flex-1">
      {showReason ? (
        <div className="space-y-2">
          <input
            className="input w-full text-sm"
            placeholder="Reason (optional)"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowReason(false)}
              className="flex-1 py-2 rounded-xl border border-gray-200 
                         text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handle}
              disabled={loading}
              className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm 
                         font-semibold hover:bg-red-100 transition-colors
                         disabled:opacity-50"
            >
              {loading ? 'Rejecting...' : 'Confirm'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowReason(true)}
          className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 
                     text-sm font-semibold hover:bg-red-50 transition-colors"
        >
          ❌ Reject
        </button>
      )}
    </div>
  )
}