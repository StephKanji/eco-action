import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  tree_planting:      '🌱 Tree Planting',
  waste_collection:   '🗑️ Waste Collection',
  recycling:          '♻️ Recycling',
  clean_energy:       '⚡ Clean Energy',
  water_conservation: '💧 Water Conservation',
  other:              '🌍 Other',
}

const UNIT_LABELS: Record<string, string> = {
  trees:           'trees',
  kg_waste:        'kg waste',
  kg_plastic:      'kg plastic',
  kwh_saved:       'kwh saved',
  litres_saved:    'litres saved',
  tasks_completed: 'tasks',
}

export default async function ChallengeFeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  // Fetch active + upcoming challenges with org info
  const { data: challenges } = await adminClient
    .from('community_challenges')
    .select(`
      id, title, description, category,
      target_value, target_unit, current_progress,
      reward_pool, participant_count,
      start_date, end_date, status,
      cover_image_url,
      organizations (org_name)
    `)
    .in('status', ['active', 'upcoming'])
    .order('end_date', { ascending: true })

  // Get challenges user has already joined
  const { data: joined } = await adminClient
    .from('challenge_participants')
    .select('challenge_id')
    .eq('user_id', user.id)

  const joinedIds = new Set((joined ?? []).map(j => j.challenge_id))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Community Challenges</h1>
        <p className="page-subtitle">
          Join forces with others to hit shared eco goals and earn from a reward pool
        </p>
      </div>

      {/* Empty state */}
      {!challenges || challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🤝</span>
          <h2 className="text-lg font-semibold text-gray-700">No challenges yet</h2>
          <p className="text-sm text-gray-400 mt-1">
            Organisations will post community challenges soon. Check back shortly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {challenges.map(challenge => {
            const org         = challenge.organizations as any
            const endDate     = new Date(challenge.end_date)
            const startDate   = new Date(challenge.start_date)
            const now         = new Date()
            const isUpcoming  = challenge.status === 'upcoming'
            const daysLeft    = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            const daysToStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            const progressPct = Math.min(
              Math.round((Number(challenge.current_progress) / Number(challenge.target_value)) * 100),
              100
            )
            const hasJoined   = joinedIds.has(challenge.id)

            return (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className="m-5 space-y-4"
              >

                <div className="p-5 btn-ghost space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium truncate">
                        {org?.org_name ?? 'Organisation'}
                      </p>
                      <h2 className="font-semibold text-gray-900 mt-0.5 leading-snug">
                        {challenge.title}
                      </h2>
                    </div>
                    {/* Reward pool badge */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-green-600">
                        {challenge.reward_pool.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">pt pool</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {challenge.description}
                  </p>

                  {/* Progress bar — only for active challenges */}
                  {!isUpcoming && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">
                          {Number(challenge.current_progress).toLocaleString()} /
                          {' '}{Number(challenge.target_value).toLocaleString()}
                          {' '}{UNIT_LABELS[challenge.target_unit] ?? challenge.target_unit}
                        </span>
                        <span className="text-xs font-semibold text-green-600">
                          {progressPct}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tags row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                      {CATEGORY_LABELS[challenge.category] ?? challenge.category}
                    </span>

                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      👥 {challenge.participant_count} joined
                    </span>

                    {/* Joined badge */}
                    {hasJoined && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                        ✓ Joined
                      </span>
                    )}

                    {/* Time indicator */}
                    {isUpcoming ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-600 ml-auto">
                        🕐 Starts in {daysToStart}d
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full ml-auto font-medium
                        ${daysLeft <= 2
                          ? 'bg-red-50 text-red-600'
                          : daysLeft <= 7
                          ? 'bg-yellow-50 text-yellow-600'
                          : 'bg-gray-100 text-gray-500'}`}>
                        ⏰ {daysLeft}d left
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}