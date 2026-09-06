const IMPACT_LABELS: Record<string, { icon: string; label: string }> = {
  tree_planting: { icon: '🌳', label: 'Trees Planted' },
  waste_collection: { icon: '🗑️', label: 'Cleanups Completed' },
  recycling: { icon: '♻️', label: ' Recycled tasks' },
  clean_energy: { icon: '⚡', label: 'Clean Energy Tasks' },
  water_conservation: { icon: '💧', label: 'Water Conservation Tasks' },
  other: { icon: '🌍', label: 'Other Contributions' },
}

export function ImpactTally({ impactByCategory }: { impactByCategory: Record<string, number> }) {
  const entries = Object.entries(impactByCategory).filter(([, count]) => count > 0)

  if (entries.length === 0) return null

  return (
    <div>
      <div className="p-1">
        <p className="profile-card-title">Your Impact</p>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {entries.map(([category, count]) => {
          const info = IMPACT_LABELS[category] ?? IMPACT_LABELS.other
          return (
            <div key={category} className="text-center">
              <p className="text-2xsm mb-1">{count}</p>
              <p className="stat-card-label">{info.icon}{info.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}