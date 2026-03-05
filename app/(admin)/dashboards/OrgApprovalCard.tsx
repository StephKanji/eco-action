'use client'

import { useState, useTransition } from 'react'
import { approveOrganization, rejectOrganization } from './action'

type Org = {
  id: string
  org_name: string
  contact_email: string
  kra_pin: string
  description: string | null
  verification_status: string
  created_at: string
  profile_id: string
}

export default function OrgApprovalCard({ org }: { org: Org }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const isReviewed = org.verification_status !== 'pending'

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const result = await approveOrganization(org.id)
      if (result?.error) setError(result.error)
    })
  }

  function handleReject() {
    if (!showRejectInput) {
      setShowRejectInput(true)
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await rejectOrganization(org.id, rejectReason)
      if (result?.error) setError(result.error)
    })
  }

  const statusBadge = {
    pending:  'bg-yellow-100 text-yellow-700',
    verified: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }[org.verification_status] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">

      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{org.org_name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{org.contact_email}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusBadge}`}>
          {org.verification_status}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">KRA PIN</p>
          <p className="text-gray-700 font-mono">{org.kra_pin}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Registered</p>
          <p className="text-gray-700">
            {new Date(org.created_at).toLocaleDateString('en-KE', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </p>
        </div>
        {org.description && (
          <div className="col-span-2">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Description</p>
            <p className="text-gray-700">{org.description}</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </p>
      )}

      {/* Reject reason input */}
      {showRejectInput && !isReviewed && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for rejection <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={2}
            placeholder="e.g. Invalid KRA PIN..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
        </div>
      )}

      {/* Actions — only show for pending orgs */}
      {!isReviewed && (
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving...' : '✅ Approve'}
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-medium py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {showRejectInput ? 'Confirm Reject' : '❌ Reject'}
          </button>
          {showRejectInput && (
            <button
              onClick={() => setShowRejectInput(false)}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}