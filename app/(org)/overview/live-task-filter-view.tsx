'use client'

import { usePendingSubmissions } from '@/hooks/usePendingSubmissions'
import TaskFilterView from './task-filter-view'

export default function LiveTaskFilterView({
  orgId,
  activeCount,
  initialPendingReviews,
  initialPendingChallengeReviews,
}: {
  orgId: string
  activeCount: number
  initialPendingReviews: number
  initialPendingChallengeReviews: number
}) {
  const { counts } = usePendingSubmissions(orgId)

  return (
    <TaskFilterView
      activeCount={activeCount}
      pendingReviews={counts.taskSubmissions > 0 ? counts.taskSubmissions : initialPendingReviews}
      pendingChallengeReviews={counts.challengeSubmissions > 0 ? counts.challengeSubmissions : initialPendingChallengeReviews}
    />
  )
}
