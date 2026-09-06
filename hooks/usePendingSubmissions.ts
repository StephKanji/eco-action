'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PendingCounts {
  taskSubmissions: number
  challengeSubmissions: number
  total: number
}

export function usePendingSubmissions(orgId: string | null | undefined) {
  const supabase = useMemo(() => createClient(), [])
  const [counts, setCounts] = useState<PendingCounts>({ taskSubmissions: 0, challengeSubmissions: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!orgId) return

    const [taskRes, challengeRes] = await Promise.all([
      supabase
        .from('task_submissions')
        .select('*, tasks!inner(org_id)', { count: 'exact', head: true })
        .eq('tasks.org_id', orgId)
        .eq('status', 'pending'),
      supabase
        .from('challenge_submissions')
        .select('*, community_challenges!inner(org_id)', { count: 'exact', head: true })
        .eq('community_challenges.org_id', orgId)
        .eq('status', 'pending'),
    ])

    const taskCount      = taskRes.count ?? 0
    const challengeCount = challengeRes.count ?? 0

    setCounts({
      taskSubmissions: taskCount,
      challengeSubmissions: challengeCount,
      total: taskCount + challengeCount,
    })
    setLoading(false)
  }, [orgId, supabase])

  useEffect(() => {
    if (!orgId) return
    fetch()

    // Re-fetch when any submission is inserted or its status changes
    const channel = supabase
      .channel(`pending-submissions:${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_submissions' }, () => fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_submissions' }, () => fetch())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, fetch, supabase])

  return { counts, loading }
}
