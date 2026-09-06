'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  tree_planting:      '🌱 Tree Planting',
  waste_collection:   '🗑️ Waste Collection',
  recycling:          '♻️ Recycling',
  clean_energy:       '⚡ Clean Energy',
  water_conservation: '💧 Water Conservation',
  other:              '🌍 Other',
}

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  reward_pool: number
  proof_type: string
  participant_count: number
  start_date: string
  end_date: string
  status: string
  cover_image_url: string | null
  organizations: { org_name: string } | null
}

interface Participant {
  user_id: string
  contribution_value: number
  points_earned: number
  profiles: { display_name: string } | null
}

interface Submission {
  id: string
  status: string
  contribution: number
  submitted_at: string
  proof_url: string
}

export default function ChallengeDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const id      = params.id as string

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ── State ────────────────────────────────────────────────
  const [challenge,     setChallenge]     = useState<Challenge | null>(null)
  const [participants,  setParticipants]  = useState<Participant[]>([])
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([])
  const [userId,        setUserId]        = useState<string | null>(null)
  const [hasJoined,     setHasJoined]     = useState(false)
  const [loading,       setLoading]       = useState(true)

  // Submit form state
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [contribution,   setContribution]   = useState<number>(1)
  const [proofFile,      setProofFile]       = useState<File | null>(null)
  const [notes,          setNotes]           = useState('')
  const [submitting,     setSubmitting]      = useState(false)
  const [joining,        setJoining]         = useState(false)
  const [formError,      setFormError]       = useState('')
  const [successMsg,     setSuccessMsg]      = useState('')
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsError, setGpsError] = useState('')
  const [capturingLocation, setCapturingLocation] = useState(false)

  function captureLocation() {
    setGpsError('')
    setCapturingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setCapturingLocation(false)
      },
      () => {
        setGpsError('Could not get your location. Please enable location access and try again.')
        setCapturingLocation(false)
      }
    )
  }

  // ── Fetch data ───────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    // Challenge
    const { data: ch } = await supabase
      .from('community_challenges')
      .select(`
        id, title, description, category,
        reward_pool, proof_type, participant_count,
        start_date, end_date, status, cover_image_url,
        organizations (org_name)
      `)
      .eq('id', id)
      .single()

    setChallenge(ch as unknown as Challenge)

    // Has user joined?
    const { data: myRow } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', id)
      .eq('user_id', user.id)
      .single()

    setHasJoined(!!myRow)

    // My submissions
    const { data: subs } = await supabase
      .from('challenge_submissions')
      .select('id, status, contribution, submitted_at, proof_url')
      .eq('challenge_id', id)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })

    setMySubmissions((subs ?? []) as Submission[])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Join challenge ───────────────────────────────────────
  async function handleJoin() {
    setJoining(true)
    setFormError('')

    const res  = await fetch('/api/challenges/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ challenge_id: id }),
    })
    const data = await res.json()

    if (!res.ok) {
      setFormError(data.error ?? 'Failed to join challenge')
    } else {
      setHasJoined(true)
      setSuccessMsg('You have joined the challenge! Submit your first contribution below.')
      setTimeout(() => setSuccessMsg(''), 4000)
      fetchAll()
    }
    setJoining(false)
  }

  // ── Submit proof ─────────────────────────────────────────
  async function handleSubmit() {
    setFormError('')

    if (challenge!.proof_type === 'gps_checkin') {
      if (!gpsLocation) { setFormError('Please check in with your location first'); return }
    } else {
      if (!proofFile) { setFormError('Please attach a proof image'); return }
    }
    if (contribution <= 0) { setFormError('Contribution must be greater than 0'); return }

    setSubmitting(true)

    const formData = new FormData()
    if (proofFile) formData.append('proof', proofFile)
    formData.append('data', JSON.stringify({
      challenge_id: id,
      contribution,
      proof_metadata: { notes: notes || undefined },
      submitted_lat: gpsLocation?.lat,
      submitted_lng: gpsLocation?.lng,
    }))

    const res = await fetch('/api/challenges/submit', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()

    if (!res.ok) {
      setFormError(data.error ?? 'Failed to submit proof')
    } else {
      setShowSubmitForm(false)
      setProofFile(null)
      setGpsLocation(null)
      setNotes('')
      setContribution(1)
      setSuccessMsg('Submission received! The organiser will review it shortly.')
      setTimeout(() => setSuccessMsg(''), 5000)
      fetchAll()
    }
    setSubmitting(false)
  }

  // ── Derived values ────────────────────────────────────────
  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-48 rounded-2xl bg-gray-100" />
      <div className="h-6 w-2/3 bg-gray-100 rounded" />
      <div className="h-4 w-full bg-gray-100 rounded" />
      <div className="h-4 w-full bg-gray-100 rounded" />
    </div>
  )

  if (!challenge) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Challenge not found.</p>
      <Link href="/challenges" className="text-green-600 text-sm mt-2 inline-block">
         Back to challenges
      </Link>
    </div>
  )

  const org         = challenge.organizations
  const isActive    = challenge.status === 'active'
  const isUpcoming  = challenge.status === 'upcoming'
  const isCompleted = ['completed', 'failed'].includes(challenge.status)
  const endDate     = new Date(challenge.end_date)
  const daysLeft    = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const myRank      = participants.findIndex(p => p.user_id === userId) + 1
  const hasPendingSubmission = mySubmissions.some(s => s.status === 'pending')

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* ── Back link ─────────────────────────────────── */}
      <Link
        href="/challenges"
        className="inline-flex items-center gap-1 text-sm text-gray-400
                   hover:text-gray-600 transition-colors"
      >
       All Challenges
      </Link>

      {/* ── Cover image ───────────────────────────────── */}
      {challenge.cover_image_url && (
        <div className="rounded-2xl overflow-hidden h-48">
          <img
            src={challenge.cover_image_url}
            alt={challenge.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ── Header card ───────────────────────────────── */}
      <div className=" space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">{org?.org_name ?? 'Organisation'}</p>
            <h1 className="page-title mt-0.5">{challenge.title}</h1>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full shrink-0
            ${isActive    ? 'bg-green-100 text-green-700'  : ''}
            ${isUpcoming  ? 'bg-purple-100 text-purple-700': ''}
            ${isCompleted ? 'bg-gray-100 text-gray-500'    : ''}`}>
            {isActive    ? ' Active'    : ''}
            {isUpcoming  ? ' Upcoming'  : ''}
            {challenge.status === 'completed' ? ' Completed' : ''}
            {challenge.status === 'failed'    ? ' Ended'     : ''}
          </span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">{challenge.description}</p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card text-center">
            <p className="stat-card-value text-xl">{challenge.reward_pool.toLocaleString()}</p>
            <p className="stat-card-label">Point Pool</p>
          </div>
          <div className="stat-card text-center">
            <p className="stat-card-value text-xl">{challenge.participant_count}</p>
            <p className="stat-card-label">Participants</p>
          </div>
          <div className="stat-card text-center">
            <p className={`stat-card-value text-xl
              ${daysLeft <= 2 ? 'text-red-600' : daysLeft <= 7 ? 'text-yellow-600' : ''}`}>
              {isCompleted ? '—' : `${daysLeft}d`}
            </p>
            <p className="stat-card-label">{isCompleted ? 'Ended' : 'Remaining'}</p>
          </div>
        </div>

        {/* Category tag */}
        <div>
          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
            {CATEGORY_LABELS[challenge.category] ?? challenge.category}
          </span>
        </div>
      </div>

      {/* ── Feedback messages ─────────────────────────── */}
      {formError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{formError}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200">
          <p className="text-sm text-green-700">{successMsg}</p>
        </div>
      )}

      {/* ── Join / Submit CTA ─────────────────────────── */}
      {isActive && (
        <div className=" space-y-3">
          {!hasJoined ? (
            <>
              <h2 className="text-sm font-semibold text-gray-700">Join this challenge</h2>
              <p className="text-xs text-gray-400">
                Join to start contributing and earn a share of the{' '}
                <span className="font-semibold text-green-600">
                  {challenge.reward_pool.toLocaleString()} point
                </span>{' '}
                reward pool.
              </p>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-3 rounded-xl bg-green-600 text-white text-sm
                           font-semibold hover:bg-green-700 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? 'Joining...' : '🤝 Join Challenge'}
              </button>
            </>
          ) : (
            <>
              {!showSubmitForm ? (
                hasPendingSubmission ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-yellow-50 text-yellow-600 text-sm
                               font-semibold cursor-not-allowed border border-yellow-200"
                  >
                    Submission Pending Review
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitForm(true)}
                    className="w-full py-3 rounded-xl bg-green-600 text-white text-sm
                               font-semibold hover:bg-green-700 transition-colors"
                  >
                    Submit Contribution
                  </button>
                )
              ) : (
                <div className="space-y-4 pt-1">
                  {/* Contribution amount */}
                  <div>
                    <label className="label">
                      Your contribution
                    </label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      className="input"
                      value={contribution}
                      onChange={e => setContribution(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  {/* Proof */}
                  {challenge.proof_type === 'gps_checkin' ? (
                    <div>
                      <label className="label">Location Check-in</label>
                      {gpsLocation ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                          <span className="text-green-600">📍</span>
                          <span className="text-sm text-green-700 flex-1">
                            {gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setGpsLocation(null)}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            Reset
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={captureLocation}
                          disabled={capturingLocation}
                          className="w-full h-24 flex flex-col items-center justify-center gap-1
                                     rounded-xl border-2 border-dashed border-gray-200
                                     hover:border-green-300 hover:bg-green-50 transition-all
                                     disabled:opacity-50"
                        >
                          <span className="text-xl">📍</span>
                          <span className="text-xs text-gray-500">
                            {capturingLocation ? 'Getting your location...' : 'Tap to check in with GPS'}
                          </span>
                        </button>
                      )}
                      {gpsError && <p className="text-xs text-red-500 mt-1">{gpsError}</p>}
                    </div>
                  ) : (
                    <div>
                      <label className="label">Proof Image</label>
                      {proofFile ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50
                                        border border-green-200">
                          <span className="text-green-600">📷</span>
                          <span className="text-sm text-green-700 flex-1 truncate">
                            {proofFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setProofFile(null)}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-24
                                          rounded-xl border-2 border-dashed border-gray-200
                                          cursor-pointer hover:border-green-300 hover:bg-green-50
                                          transition-all">
                          <span className="text-xl mb-1">📸</span>
                          <span className="text-xs text-gray-500">Tap to attach proof photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) setProofFile(f)
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="label">
                      Notes <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      className="input h-20 resize-none"
                      placeholder="Any additional context for the reviewer..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowSubmitForm(false); setFormError('') }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200
                                 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-green-600 text-white
                                 text-sm font-semibold hover:bg-green-700 transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isCompleted && hasJoined && (
        <div className="pt-1">
          <p className="text-sm text-gray-500 font-medium">
             This challenge has ended.
          </p>
        </div>
      )}

      {/* ── Join CTA for upcoming challenges ──────────── */}
      {isUpcoming && !hasJoined && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Get ready — join early</h2>
          <p className="text-xs text-gray-400">
            This challenge hasn't started yet, but you can join now to be ready when it opens.
            Submissions unlock once the challenge goes live.
          </p>
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-3 rounded-xl bg-green-600 text-white text-sm
                       font-semibold hover:bg-green-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joining ? 'Joining...' : '🤝 Join Challenge'}
          </button>
        </div>
      )}

      {isUpcoming && hasJoined && (
        <div className="card">
          <p className="text-sm text-green-700 font-medium">
           You're in! Submissions open once this challenge goes live.
          </p>
        </div>
      )}

      {/* ── My Submissions ────────────────────────────── */}
      {mySubmissions.length > 0 && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">My Submissions</h2>
          <div className="space-y-2">
            {mySubmissions.map(sub => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50
                           border border-gray-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    +{sub.contribution}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(sub.submitted_at).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium
                  ${sub.status === 'approved' ? 'bg-green-100 text-green-700'  : ''}
                  ${sub.status === 'pending'  ? 'bg-yellow-100 text-yellow-700': ''}
                  ${sub.status === 'rejected' ? 'bg-red-100 text-red-700'      : ''}`}>
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Link
        href={`/usertasks`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Explore more Tasks
      </Link>
    </div>
    
  )
  
}