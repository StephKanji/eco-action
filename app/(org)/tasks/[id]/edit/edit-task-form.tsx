// app/(org)/tasks/[id]/edit/edit-task-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const CATEGORIES = [
  { value: 'tree_planting', label: 'Tree Planting' },
  { value: 'waste_collection', label: 'Waste Collection' },
  { value: 'recycling', label: 'Recycling' },
  { value: 'clean_energy', label: 'Clean Energy' },
  { value: 'water_conservation', label: 'Water Conservation' },
  { value: 'other', label: 'Other' },
]

export default function EditTaskForm({ task }: { task: any }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
    category: task.category,
    status: task.status,
    max_participants: task.max_participants ?? '',
    deadline: task.deadline ? task.deadline.slice(0, 16) : '',
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  function update(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setPending(true)
    setError('')

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        title: form.title,
        description: form.description,
        category: form.category,
        status: form.status,
        max_participants: form.max_participants ? parseInt(form.max_participants as any) : null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      })
      .eq('id', task.id)

    if (updateError) {
      setError(updateError.message)
      setPending(false)
      return
    }

    router.push('/overview/active-tasks')
  }

  return (
    <div className="card space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <label className="label">Title</label>
        <input className="input" value={form.title} onChange={e => update('title', e.target.value)} />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea className="input h-28 resize-none" value={form.description} onChange={e => update('description', e.target.value)} />
      </div>

      <div>
        <label className="label">Category</label>
        <select className="input" value={form.category} onChange={e => update('category', e.target.value)}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={e => update('status', e.target.value)}>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label className="label">Deadline</label>
        <input type="datetime-local" className="input" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
      </div>

      <div>
        <label className="label">Max Participants (optional)</label>
        <input type="number" className="input" value={form.max_participants} onChange={e => update('max_participants', e.target.value)} />
      </div>

      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Reward (locked)</p>
        <p className="text-sm font-semibold text-gray-700 mt-1">{task.reward_points.toLocaleString()} points</p>
      </div>

      <button
        onClick={handleSave}
        disabled={pending}
        className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}