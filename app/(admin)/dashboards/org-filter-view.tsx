'use client'

import { useMemo, useState } from 'react'
import OrgApprovalCard from './OrgApprovalCard'

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

type Filter = 'all' | 'pending' | 'verified' | 'rejected'

export default function OrgFilterView({
  organizations,
  pendingCount,
  verifiedCount,
  rejectedCount,
}: {
  organizations: Org[]
  pendingCount: number
  verifiedCount: number
  rejectedCount: number
}) {
  const [filter, setFilter] = useState<Filter>('pending')

  const filtered = useMemo(() => {
    if (filter === 'all') return organizations
    return organizations.filter((o) => o.verification_status === filter)
  }, [organizations, filter])

  const emptyMessage: Record<Filter, string> = {
    all: 'No organisations yet.',
    pending: 'No pending organisations 🎉',
    verified: 'No verified organisations yet.',
    rejected: 'No rejected organisations.',
  }

  return (
    <div className="space-y-5">
      {/* ── Stat cards double as quick filters ── */}
      <div className="grid grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`admin-stat-card bg-yellow-50 text-yellow-800 text-left ${filter === 'pending' ? 'active' : ''}`}
        >
          <p className="text-sm text-yellow-700 font-medium">Pending review</p>
          <p className="text-3xl font-bold mt-1">{pendingCount}</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter('verified')}
          className={`admin-stat-card bg-green-50 text-green-800 text-left ${filter === 'verified' ? 'active' : ''}`}
        >
          <p className="text-sm text-green-700 font-medium">Verified</p>
          <p className="text-3xl font-bold mt-1">{verifiedCount}</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter('rejected')}
          className={`admin-stat-card bg-red-50 text-red-800 text-left ${filter === 'rejected' ? 'active' : ''}`}
        >
          <p className="text-sm text-red-700 font-medium">Rejected</p>
          <p className="text-3xl font-bold mt-1">{rejectedCount}</p>
        </button>
      </div>

      {/* ── Section header + dropdown ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-gray-900">
          {filtered.length} organisation{filtered.length === 1 ? '' : 's'}
        </h2>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="admin-filter-select"
        >
          <option value="all">All ({organizations.length})</option>
          <option value="pending">Pending ({pendingCount})</option>
          <option value="verified">Verified ({verifiedCount})</option>
          <option value="rejected">Rejected ({rejectedCount})</option>
        </select>
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">{emptyMessage[filter]}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((org) => (
            <OrgApprovalCard key={org.id} org={org} />
          ))}
        </div>
      )}
    </div>
  )
}