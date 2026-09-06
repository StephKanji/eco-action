'use client'

import { useState } from 'react'
import Link from 'next/link'

type Filter = 'active' | 'pending' | 'challengeReviews'

export default function TaskFilterView({
  activeCount,
  pendingReviews,
  pendingChallengeReviews,
}: {
  activeCount: number
  pendingReviews: number
  pendingChallengeReviews: number
}) {
  const [filter, setFilter] = useState<Filter>('active')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`admin-stat-card bg-green-50 text-green-800 text-left ${filter === 'active' ? 'active' : ''}`}
        >
          <p className="text-sm text-green-700 font-medium">Active Challenges</p>
          <p className="text-3xl font-bold mt-1">{activeCount}</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`admin-stat-card bg-yellow-50 text-yellow-800 text-left ${filter === 'pending' ? 'active' : ''}`}
        >
          <p className="text-sm text-yellow-700 font-medium">Individual Challenges</p>
          <p className="text-3xl font-bold mt-1">{pendingReviews}</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter('challengeReviews')}
          className={`admin-stat-card bg-blue-50 text-blue-800 text-left ${filter === 'challengeReviews' ? 'active' : ''}`}
        >
          <p className="text-sm text-blue-700 font-medium">Community Challenges</p>
          <p className="text-3xl font-bold mt-1">{pendingChallengeReviews}</p>
        </button>
      </div>

      {filter === 'active' && (
        <Link href="/tasks/active" className="card-strong block">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-white">
                {activeCount > 0 ? `${activeCount} active task${activeCount === 1 ? '' : 's'}` : 'No active tasks yet'}
              </p>
              <p className="text-xs text-white/70 mt-0.5">View all active tasks </p>
            </div>
          </div>
        </Link>
      )}

      {filter === 'pending' && (
        <Link href="/submissions" className="card-strong block">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-white">
                {pendingReviews > 0 ? `${pendingReviews} submission${pendingReviews === 1 ? '' : 's'} awaiting review` : 'No pending Individual Reviews'}
              </p>
              <p className="text-xs text-white/70 mt-0.5">Review Individual Submissions </p>
            </div>
          </div>
        </Link>
      )}

      {filter === 'challengeReviews' && (
        <Link href="/challenges/submissions" className="card-strong block">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-white">
                {pendingChallengeReviews > 0 ? `${pendingChallengeReviews} challenge submission${pendingChallengeReviews === 1 ? '' : 's'} awaiting review` : 'No pending challenge reviews'}
              </p>
              <p className="text-xs text-white/70 mt-0.5">Review Community Challenges </p>
            </div>
          </div>
        </Link>
      )}
    </div>
  )
}