'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'tree_planting', label: ' Tree Planting', unit: 'trees' },
  { value: 'waste_collection', label: ' Waste Collection', unit: 'kg_waste' },
  { value: 'recycling', label: ' Recycling', unit: 'kg_plastic' },
  { value: 'clean_energy', label: ' Clean Energy', unit: 'kwh_saved' },
  { value: 'water_conservation', label: ' Water Conservation', unit: 'litres_saved' },
  { value: 'other', label: ' Other', unit: 'tasks_completed' },
]

// Human-readable unit labels shown in the UI
const UNIT_LABELS: Record<string, string> = {
  trees: 'Trees planted',
  kg_waste: 'KG of waste collected',
  kg_plastic: 'KG of plastic recycled',
  kwh_saved: 'KWH of energy saved',
  litres_saved: 'Litres of water saved',
  tasks_completed: 'Tasks completed',
}

const STEPS = ['Basic Info', 'Target & Duration', 'Reward Pool', 'Preview']

interface FormData {
  title: string
  description: string
  category: string
  target_value: number
  target_unit: string
  reward_pool: number
  start_date: string
  end_date: string
  cover_image: File | null
  cover_image_url: string
  max_participants: number | null
}

export default function NewChallengePage() {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    target_value: 10,
    target_unit: 'trees',
    reward_pool: 500,
    start_date: '',
    end_date: '',
    cover_image: null,
    cover_image_url: '',
    max_participants: null,
  })

  function update(field: keyof FormData, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // When category changes, auto-set the default unit
  function selectCategory(value: string) {
    const cat = CATEGORIES.find(c => c.value === value)
    update('category', value)
    if (cat) update('target_unit', cat.unit)
  }



  function validateStep(): string | null {
    if (step === 0) {
      if (!form.title.trim()) return 'Title is required'
      if (form.title.length < 5) return 'Title must be at least 5 characters'
      if (!form.description.trim()) return 'Description is required'
      if (form.description.length < 20) return 'Description must be at least 20 characters'
      if (!form.category) return 'Category is required'
    }
    if (step === 1) {
      if (!form.target_value || form.target_value <= 0) return 'Target value must be greater than 0'
      if (!form.start_date) return 'Start date is required'
      if (!form.end_date) return 'End date is required'
      if (new Date(form.end_date) <= new Date(form.start_date))
        return 'End date must be after start date'
      if (new Date(form.end_date) <= new Date())
        return 'End date must be in the future'
    }
    if (step === 2) {
      if (form.reward_pool < 100) return 'Minimum reward pool is 100 points'
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
      const res = await fetch('/api/challenges/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          target_value: form.target_value,
          target_unit: form.target_unit,
          reward_pool: form.reward_pool,
          start_date: new Date(form.start_date).toISOString(),
          end_date: new Date(form.end_date).toISOString(),
          cover_image_url: form.cover_image_url || undefined,
          max_participants: form.max_participants ?? undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to create challenge')
        setPending(false)
        return
      }

      router.push('/overview')
    } catch {
      setError('Something went wrong. Please try again.')
      setPending(false)
    }
  }

  const selectedCategory = CATEGORIES.find(c => c.value === form.category)
  const durationDays = form.start_date && form.end_date
    ? Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Create a Challenge</h1>
        <p className="page-subtitle">Rally your community around a shared eco goal</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
              transition-colors
              ${i < step
                ? 'bg-green-600 text-white'
                : i === step
                  ? 'bg-green-600 text-white ring-2 ring-green-200'
                  : 'bg-gray-100 text-gray-400'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs hidden sm:block transition-colors
              ${i === step ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-px transition-colors ${i < step ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* ── Step 0 — Basic Info ──────────────────────────── */}
      {step === 0 && (
        <div className="card space-y-5">
          <div>
            <label className="label">Challenge Title</label>
            <input
              className="input"
              placeholder="e.g. Plant 100 Trees Across Nairobi"
              value={form.title}
              onChange={e => update('title', e.target.value)}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input h-32 resize-none"
              placeholder="Describe the challenge goal, what participants need to do, and why it matters..."
              value={form.description}
              onChange={e => update('description', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">{form.description.length} / 2000</p>
          </div>

          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => selectCategory(c.value)}
                  className={`p-3 rounded-xl border text-sm text-left transition-all
                    ${form.category === c.value
                      ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            


          </div>

<div>
              <label className="label">
                Max Participants{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Leave blank to allow unlimited participants
              </p>
              <input
                type="number"
                min={2}
                className="input"
                placeholder="e.g. 50"
                value={form.max_participants ?? ''}
                onChange={e => update(
                  'max_participants',
                  e.target.value ? parseInt(e.target.value) : null
                )}
              />
            </div>
        </div>
      )}

      {/* ── Step 1 — Target & Duration ───────────────────── */}
      {step === 1 && (
        <div className="card space-y-5">

          {/* Target */}
          <div>
            <label className="label">Community Target</label>
            <p className="text-xs text-gray-400 mb-2">
              What does the whole community need to achieve together?
            </p>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                min={1}
                className="input w-32 text-center text-xl font-bold"
                value={form.target_value}
                onChange={e => update('target_value', parseFloat(e.target.value) || 0)}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {UNIT_LABELS[form.target_unit] ?? form.target_unit}
                </p>
                {selectedCategory && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Auto-set from category · You can change the unit below
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Unit override */}
          <div>
            <label className="label">Unit <span className="text-gray-400 font-normal">(customise if needed)</span></label>
            <select
              className="input"
              value={form.target_unit}
              onChange={e => update('target_unit', e.target.value)}
            >
              {Object.entries(UNIT_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Start Date</label>
              <input
                type="datetime-local"
                className="input"
                value={form.start_date}
                onChange={e => update('start_date', e.target.value)}
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="datetime-local"
                className="input"
                value={form.end_date}
                onChange={e => update('end_date', e.target.value)}
              />
            </div>
          </div>

          {durationDays && durationDays > 0 && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-sm text-blue-700">
                ⏱Challenge runs for <span className="font-semibold">{durationDays} day{durationDays !== 1 ? 's' : ''}</span>
              </p>
            </div>
          )}
        </div>
      )}




      {/* ── Step 2 — Reward Pool ─────────────────────────── */}
      {step === 2 && (
        <div className="card space-y-5">
          <div>
            <label className="label">Total Reward Pool</label>
            <p className="text-xs text-gray-400 mb-2">
              Points shared proportionally among all participants based on their contribution.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={100}
                step={50}
                className="input flex-1 text-lg font-bold"
                value={form.reward_pool}
                onChange={e => update('reward_pool', parseInt(e.target.value) || 0)}
              />
              <span className="text-sm text-gray-500 shrink-0">points</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Minimum 100 points</p>
          </div>

          {/* Quick select */}
          <div>
            <label className="label text-xs">Quick select</label>
            <div className="flex gap-2 flex-wrap">
              {[500, 1000, 2500, 5000, 10000].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update('reward_pool', v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${form.reward_pool === v
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-200 text-gray-600 hover:border-green-300'}`}
                >
                  {v.toLocaleString()} pts
                </button>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="p-4 rounded-xl bg-green-50 border border-green-100 space-y-2">
            <p className="text-sm font-medium text-green-800">How the reward pool works</p>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• The full {form.reward_pool.toLocaleString()} pts will be locked in escrow when you publish</li>
              <li>• Points are split proportionally — bigger contributions earn more</li>
              <li>• If the target is not reached by the end date, participants receive a partial payout based on progress</li>
              <li>• Remaining points are returned to your balance</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Step 3 — Preview ─────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="card space-y-4">


            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-gray-900 text-lg leading-snug">{form.title}</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 shrink-0">
                {selectedCategory?.label}
              </span>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">{form.description}</p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <p className="stat-card-value text-2xl">
                  {form.target_value.toLocaleString()}
                </p>
                <p className="stat-card-label">{UNIT_LABELS[form.target_unit] ?? form.target_unit}</p>
              </div>
              <div >
                <p className="stat-card-value text-2xl text-green-600">
                  {form.reward_pool.toLocaleString()}
                </p>
                <p className="stat-card-label">Point Reward Pool</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Start</p>
                <p className="text-sm font-medium text-gray-800">
                  {form.start_date
                    ? new Date(form.start_date).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                    : '—'}
                </p>
              </div>
              {form.max_participants && (
                <div >
                  <p className="stat-card-value text-2xl">
                    {form.max_participants.toLocaleString()}
                  </p>
                  <p className="stat-card-label">Max Participants</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">End</p>
                <p className="text-sm font-medium text-gray-800">
                  {form.end_date
                    ? new Date(form.end_date).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center px-4">
            Publishing will lock <span className="font-semibold">{form.reward_pool.toLocaleString()} points</span> in
            escrow. Make sure you have sufficient balance before confirming.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
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
            {pending ? 'Publishing...' : ' Publish Challenge'}
          </button>
        )}
      </div>

      <Link
        href="/overview"
        className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Back to Dashboard
      </Link>

    </div>
  )
}