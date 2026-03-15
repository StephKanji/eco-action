'use client'

import { useWallet } from '@/hooks/use-wallet'
import { Coins, TrendingUp, Star } from 'lucide-react'

interface WalletCardProps {
  userId: string
}

// Next tier thresholds
const TIER_THRESHOLDS: Record<number, number> = {
  1: 1000,   // Seedling → Sprout
  2: 5000,   // Sprout → Guardian
  3: 15000,  // Guardian → Champion
  4: 40000,  // Champion → EcoLegend
  5: 40000,  // EcoLegend — max tier
}

export function WalletCard({ userId }: WalletCardProps) {
  const { wallet, loading } = useWallet(userId)

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
        <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-full bg-gray-200 rounded" />
      </div>
    )
  }

  if (!wallet) return null

  const nextThreshold = TIER_THRESHOLDS[wallet.tier_id] ?? 40000
  const prevThreshold = [0, 0, 1000, 5000, 15000, 40000][wallet.tier_id] ?? 0
  const progressPercent = wallet.tier_id === 5 ? 100 : Math.min(
    ((wallet.lifetime_points - prevThreshold) /
      (nextThreshold - prevThreshold)) * 100,
    100
  )

  return (
    <div className='items-center justify-center text-center'>

      {/* Tier badge */}
      <div >
        <div
          className="flex items-center gap-2 w-max text-white"
          style={{ backgroundColor: wallet.tier_color }}
        >
          <Star className="w-3 h-3" />
          {wallet.tier_name}
        </div>
        {wallet.bonus_percent > 0 && (
          <span className="text-xs text-green-600 font-medium">
            +{wallet.bonus_percent}% bonus active
          </span>
        )}
      </div>

      {/* Current points */}
      <div>
        <p className="profile-member-since mb-1 text-gray-500">
          Available Points
        </p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {wallet.current_points.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Lifetime points + tier progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3" />
            <span>{wallet.lifetime_points.toLocaleString()} lifetime pts</span>
          </div>
          {wallet.tier_id < 5 && (
            <span>{nextThreshold.toLocaleString()} for next tier</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: wallet.tier_color,
            }}
          />
        </div>

        {wallet.tier_id === 5 && (
          <p className="text-xs text-center font-medium"
            style={{ color: wallet.tier_color }}>
            Maximum tier reached 🎉
          </p>
        )}
      </div>
    </div>
  )
}