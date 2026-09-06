'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Badge {
  milestone_key: string
  name: string
  description: string
  icon: string
  achieved_at: string | null
}

interface BadgeListProps {
  userId: string
  initialBadges: Badge[]
}

export function BadgeList({ userId, initialBadges }: BadgeListProps) {
  const [badges, setBadges] = useState<Badge[]>(initialBadges)
  const [newBadge, setNewBadge] = useState<Badge | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Real-time subscription for new badges
    const channel = supabase
      .channel(`badges:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_milestones',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Fetch full badge details
          const { data } = await supabase
            .from('user_milestones')
            .select(`
              milestone_key, achieved_at,
              badges!inner (name, description, icon)
            `)
            .eq('user_id', userId)
            .eq('milestone_key', payload.new.milestone_key)
            .single()

          if (data) {
            const badge = {
              milestone_key: data.milestone_key,
              achieved_at: data.achieved_at,
              name: (data.badges as any).name,
              description: (data.badges as any).description,
              icon: (data.badges as any).icon,
            }
            setBadges(prev => [...prev, badge])
            setNewBadge(badge)
            setTimeout(() => setNewBadge(null), 4000)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return (
    <>
      {/* New badge toast notification */}
      {newBadge && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                        bg-transparent text-white px-5 py-3 rounded-2xl shadow-xl
                        flex items-center gap-3 animate-bounce">
          <span className="text-2xl">{newBadge.icon}</span>
          <div>
            <p className="text-xs text-gray-400 font-medium">New Badge Unlocked!</p>
            <p className="font-semibold text-sm">{newBadge.name}</p>
          </div>
        </div>
      )}

      {/* Badge grid */}
      {badges.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Complete tasks to earn badges</p>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {badges.map(badge => (
            <div
              key={badge.milestone_key}
              className="flex flex-col items-center text-center p-1
                         rounded-2xl bg-transparent"
            >
              <span className="text-3xl mb-1">{badge.icon}</span>
              <p className="text-xs font-semibold text-gray-800 leading-tight">
                {badge.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}