'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import map to avoid SSR issues with Leaflet
const LocationPicker = dynamic(
  () => import('@/components/tasks/location-picker'),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" /> }
)

const CATEGORIES = [
  { value: 'tree_planting',     label: ' Tree Planting' },
  { value: 'waste_collection',  label: ' Waste Collection' },
  { value: 'recycling',         label: ' Recycling' },
  { value: 'clean_energy',      label: ' Clean Energy' },
  { value: 'water_conservation',label: ' Water Conservation' },
  { value: 'other',             label: ' Other' },
]

const PROOF_TYPES = [
  { value: 'photo',       label: ' Photo Upload' },
  { value: 'gps_checkin', label: ' GPS Check-in' },
  { value: 'receipt',     label: ' Receipt' },
]

const STEPS = ['Basic Info', 'Proof & Location', 'Rewards', 'Preview']

interface FormData {
  title: string
  description: string
  category: string
  proof_type: string
  location_name: string
  location_lat: number | null
  location_lng: number | null
  location_radius_km: number
  reward_points: number
  max_participants: number | null
  min_tier_id: number | null
  deadline: string
}

export default function NewTaskPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [step, setStep] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    proof_type: 'photo',
    location_name: '',
    location_lat: null,
    location_lng: null,
    location_radius_km: 1.0,
    reward_points: 100,
    max_participants: null,
    min_tier_id: null,
    deadline: '',
  })

  function update(field: keyof FormData, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.title.trim()) return 'Title is required'
      if (!form.description.trim()) return 'Description is required'
      if (!form.category) return 'Category is required'
    }
    if (step === 1) {
      if (!form.proof_type) return 'Proof type is required'
      if (!form.deadline) return 'Deadline is required'
      if (new Date(form.deadline) <= new Date()) return 'Deadline must be in the future'
    }
    if (step === 2) {
      if (form.reward_points < 10) return 'Minimum reward is 10 points'
    }
    return null
  }

  function nextStep() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  async function handlePublish() {
    setPending(true)
    setError('')

    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to create task')
        setPending(false)
        return
      }

      router.push('/overview')
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setPending(false)
    }
  }

  return (
    <div className="hero-root pt-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Create New Task</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
              ${i <= step ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {i + 1}
            </div>
            <span className={`text-xs hidden sm:block
              ${i === step ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-px ${i < step ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Step 0 — Basic Info */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input
              className="input w-full"
              placeholder="e.g. Plant 5 trees in Karura Forest"
              value={form.title}
              onChange={e => update('title', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input w-full h-32 resize-none"
              placeholder="Describe what participants need to do..."
              value={form.description}
              onChange={e => update('description', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => update('category', c.value)}
                  className={`p-3 rounded-xl border text-sm text-left transition-all
                    ${form.category === c.value
                      ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1 — Proof & Location */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Proof Type</label>
            <div className="grid grid-cols-2 gap-2">
              {PROOF_TYPES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => update('proof_type', p.value)}
                  className={`p-3 rounded-xl border text-sm text-left transition-all
                    ${form.proof_type === p.value
                      ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
            <input
              className="input w-full"
              placeholder="e.g. Karura Forest, Nairobi"
              value={form.location_name}
              onChange={e => update('location_name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pin Location (optional)
            </label>
            <LocationPicker
              lat={form.location_lat}
              lng={form.location_lng}
              radius={form.location_radius_km}
              onChange={(lat, lng) => {
                update('location_lat', lat)
                update('location_lng', lng)
              }}
              onRadiusChange={r => update('location_radius_km', r)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="datetime-local"
              className="input w-full"
              value={form.deadline}
              onChange={e => update('deadline', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step 2 — Rewards */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reward Points per Participant
            </label>
            <input
              type="number"
              min={10}
              className="input w-full"
              value={form.reward_points}
              onChange={e => update('reward_points', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 10 points</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Participants (optional)
            </label>
            <input
              type="number"
              min={1}
              className="input w-full"
              placeholder="Leave blank for unlimited"
              value={form.max_participants ?? ''}
              onChange={e => update('max_participants', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Tier Required (optional)
            </label>
            <select
              className="input w-full"
              value={form.min_tier_id ?? ''}
              onChange={e => update('min_tier_id', e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">No minimum — open to all</option>
              <option value="1">🌱 Seedling+</option>
              <option value="2">🌿 Sprout+</option>
              <option value="3">🌳 Guardian+</option>
              <option value="4">🌍 Champion+</option>
              <option value="5">🏆 EcoLegend only</option>
            </select>
          </div>

          {/* Cost summary */}
          <div className="p-4 rounded-xl bg-green-50 border border-green-100">
            <p className="text-sm font-medium text-green-800 mb-1">Escrow Summary</p>
            <p className="text-xs text-green-700">
              {form.max_participants
                ? `${form.reward_points} pts × ${form.max_participants} participants = `
                : 'Per approval: '}
              <span className="font-bold">
                {form.max_participants
                  ? `${(form.reward_points * form.max_participants).toLocaleString()} pts total`
                  : `${form.reward_points} pts`}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              These points will be locked in escrow when you publish.
            </p>
          </div>
        </div>
      )}

      {/* Step 3 — Preview */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <h2 className="font-bold text-gray-900 text-lg">{form.title}</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                {CATEGORIES.find(c => c.value === form.category)?.label}
              </span>
            </div>
            <p className="text-sm text-gray-600">{form.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm pt-2">
              <div>
                <p className="text-xs text-gray-400">Reward</p>
                <p className="font-semibold text-green-600">{form.reward_points} pts</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Proof Required</p>
                <p className="font-medium">{PROOF_TYPES.find(p => p.value === form.proof_type)?.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Deadline</p>
                <p className="font-medium">
                  {form.deadline ? new Date(form.deadline).toLocaleDateString('en-KE', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  }) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="font-medium">{form.location_name || 'No specific location'}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Publishing will lock points in escrow. Review carefully before confirming.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            type="button"
            onClick={() => { setError(''); setStep(s => s - 1) }}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 
                       text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 py-2.5 px-4 rounded-xl bg-green-600 text-white 
                       text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={pending}
            className="flex-1 py-2.5 px-4 rounded-xl bg-green-600 text-white 
                       text-sm font-semibold hover:bg-green-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Publishing...' : 'Publish Task'}
          </button>
        )}

      </div>
      
        <Link href="/orgdashboard" className="text-sm mt-4 text-gray-500 hover:text-gray-700">
          Back to Dashboard
        </Link>
    </div>
  )
}