'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WalletData {
  current_points: number
  lifetime_points: number
  tier_id: number
  tier_name: string
  tier_color: string
  bonus_percent: number
}

export function useWallet(userId: string | null | undefined) {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchWallet = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('users')
      .select(`
        current_points,
        lifetime_points,
        tier_id,
        tiers (
          name,
          badge_color,
          point_bonus_percent
        )
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Wallet fetch error:', error)
      setLoading(false)
      return
    }

    if (data) {
      const tiers = data.tiers as {
        name: string
        badge_color: string
        point_bonus_percent: number
      }
      setWallet({
        current_points: data.current_points,
        lifetime_points: data.lifetime_points,
        tier_id: data.tier_id!,
        tier_name: tiers.name,
        tier_color: tiers.badge_color,
        bonus_percent: tiers.point_bonus_percent,
      })
    }
    setLoading(false)
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) return
    fetchWallet()

    const channel = supabase
      .channel(`wallet:${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        () => fetchWallet()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchWallet, supabase])

  return { wallet, loading }
}
