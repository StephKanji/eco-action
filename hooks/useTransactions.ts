'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Transaction = {
  id: string
  created_at: string
  type: string
  amount: number
  from_entity_name: string | null
  to_entity_name: string | null
  notes: string | null
}

// entityId  — the user.id or org.id to filter by (or null for admin = all)
// entityType — 'user' | 'org' | 'admin'
export function useTransactions(
  entityId: string | null | undefined,
  entityType: 'user' | 'org' | 'admin'
) {
  const supabase = useMemo(() => createClient(), [])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    let query = supabase
      .from('point_transactions_enriched')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(entityType === 'admin' ? 100 : 50)

    if (entityType !== 'admin' && entityId) {
      query = query.or(`from_entity_id.eq.${entityId},to_entity_id.eq.${entityId}`)
    }

    const { data, error } = await query
    if (!error && data) setTransactions(data as Transaction[])
    setLoading(false)
  }, [entityId, entityType, supabase])

  useEffect(() => {
    fetch()

    // Listen for any new inserts into point_transactions —
    // re-fetch from the enriched view which has resolved names
    const channel = supabase
      .channel(`transactions:${entityType}:${entityId ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'point_transactions' },
        () => fetch()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetch, entityId, entityType, supabase])

  return { transactions, loading }
}
