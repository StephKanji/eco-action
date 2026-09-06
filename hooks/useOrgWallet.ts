'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OrgWallet {
  points_balance: number
  escrow_balance: number
}

export function useOrgWallet(orgId: string | null | undefined) {
  const supabase = useMemo(() => createClient(), [])
  const [wallet, setWallet] = useState<OrgWallet | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!orgId) return
    const { data, error } = await supabase
      .from('organizations')
      .select('points_balance, escrow_balance')
      .eq('id', orgId)
      .single()

    if (!error && data) setWallet(data)
    setLoading(false)
  }, [orgId, supabase])

  useEffect(() => {
    if (!orgId) return
    fetch()

    const channel = supabase
      .channel(`org-wallet:${orgId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'organizations', filter: `id=eq.${orgId}` },
        () => fetch()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, fetch, supabase])

  return { wallet, loading }
}
