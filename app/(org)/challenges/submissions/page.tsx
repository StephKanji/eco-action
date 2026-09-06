import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ChallengeReviewButton } from '@/components/challenges/challenge-review-button'
import Link from 'next/link'

export default async function ChallengeSubmissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: org } = await adminClient
    .from('organizations')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!org) redirect('/login')

  // Fetch all challenge submissions for this org's challenges
  const { data: submissions } = await adminClient
    .from('challenge_submissions')
    .select(`
      id, status, contribution, submitted_at, proof_url,
      submitted_lat, submitted_lng,
      rejection_reason, proof_metadata,
      community_challenges!inner (
        id, title, proof_type, org_id
      ),
      users!inner (
        id,
        profiles (display_name)
      )
    `)
    .eq('community_challenges.org_id', org.id)
    .order('submitted_at', { ascending: false })

  // Filter to only this org's challenges (RLS does this but double-check)
  const filtered = (submissions ?? []).filter(
    s => (s.community_challenges as any)?.org_id === org.id
  )

  const pending  = filtered.filter(s => s.status === 'pending')
  const reviewed = filtered.filter(s => s.status !== 'pending')

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Challenge Submissions</h1>
          <p className="page-subtitle">
            Review contributions from community challenge participants
          </p>
        </div>
        <Link
          href="/overview"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Pending */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700">Pending Review</h2>
          {pending.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="card text-center py-8">
            <span className="text-3xl">✅</span>
            <p className="text-sm text-gray-500 mt-2">All caught up — no pending submissions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(sub => {
              const challenge = sub.community_challenges as any
              const userInfo  = sub.users as any
              const name      = userInfo?.profiles?.display_name ?? 'Unknown User'
              const isGps     = challenge?.proof_type === 'gps_checkin'

              return (
                <div key={sub.id} className="card space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 truncate">{challenge?.title}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-green-600">
                        +{sub.contribution}
                      </p>
                    </div>
                  </div>

                  {/* Proof — image or GPS coordinates depending on challenge type */}
                  {isGps ? (
                    sub.submitted_lat && sub.submitted_lng && (
                      <a
                        href={`https://www.google.com/maps?q=${sub.submitted_lat},${sub.submitted_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 transition-colors"
                      >
                        <span className="text-blue-600">📍</span>
                        <span className="text-sm text-blue-700">
                          {sub.submitted_lat.toFixed(5)}, {sub.submitted_lng.toFixed(5)}
                        </span>
                        <span className="text-xs text-blue-400 ml-auto">View on map ↗</span>
                      </a>
                    )
                  ) : (
                    sub.proof_url && (
                      <a
                        href={sub.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl overflow-hidden border border-gray-100 hover:border-green-200 transition-colors"
                      >
                        <img
                          src={sub.proof_url}
                          alt="Proof"
                          className="w-full h-48 object-cover"
                        />
                        <p className="text-xs text-gray-400 text-center py-1.5">
                          Tap to open full image ↗
                        </p>
                      </a>
                    )
                  )}

                  {/* Notes */}
                  {(sub.proof_metadata as any)?.notes && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-1">Participant Notes</p>
                      <p className="text-sm text-gray-700">{(sub.proof_metadata as any).notes}</p>
                    </div>
                  )}

                  {/* Submitted at */}
                  <p className="text-xs text-gray-400">
                    Submitted{' '}
                    {new Date(sub.submitted_at).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>

                  {/* Review buttons */}
                  <ChallengeReviewButton submissionId={sub.id} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Recently Reviewed</h2>
          <div className="space-y-2">
            {reviewed.slice(0, 10).map(sub => {
              const challenge = sub.community_challenges as any
              const userInfo  = sub.users as any
              const name      = userInfo?.profiles?.display_name ?? 'Unknown User'

              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{challenge?.title}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-gray-700">
                      +{sub.contribution}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${sub.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {sub.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}