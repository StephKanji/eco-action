'use client'

import { useOrgWallet } from '@/hooks/useOrgWallet'

export default function OrgWalletBalances({
  orgId,
  initialPoints,
  initialEscrow,
}: {
  orgId: string
  initialPoints: number
  initialEscrow: number
}) {
  const { wallet } = useOrgWallet(orgId)

  const points = wallet?.points_balance ?? initialPoints
  const escrow = wallet?.escrow_balance ?? initialEscrow

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="stat-card">
        <p className="stat-card-value">{points.toLocaleString()}</p>
        <p className="stat-card-label">Available Points</p>
      </div>
      <div className="stat-card">
        <p className="stat-card-value">{escrow.toLocaleString()}</p>
        <p className="stat-card-label">In Escrow</p>
      </div>
    </div>
  )
}
