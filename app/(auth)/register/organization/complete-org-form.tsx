'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CompleteOrgForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [email, setEmail] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgName = searchParams.get('org_name') ?? ''

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login')
        return
      }
      setEmail(data.user.email ?? '')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setErrors({})

    const form = new FormData(e.currentTarget)
    const description = form.get('description') as string

  

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const res = await fetch('/api/complete-org-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, description }),
    })

    if (!res.ok) {
      const err = await res.json()
      setErrors({ general: err.error ?? 'Something went wrong. Please try again.' })
      setPending(false)
      return
    }

    router.push('/register/organization/pending')
  }

  return (
    <div className='hero-section pt-5'>

      <div>
        <h1 className="hero-title" style={{ fontSize: 'clamp(1.6rem, 3vw, 3.0rem)', marginBottom: '6px' }}>
          Almost there, <em>{orgName || 'Activist'}</em>
        </h1>
        
        <p className="hero-subtitle">
          Add a short description, and we'll submit your organisation for admin review.
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="input-label">Signed in as</label>
          <input type="text" value={email} disabled className="input" />
        </div>


        <div>
          <label htmlFor="description" className="input-label">
            Description{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Explain briefly what your organization does and your sustainability initiatives."
            className="input"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 px-4 btn btn-ghost"
        >
          {pending ? 'Submitting...' : 'Finish setting up'}
        </button>
      </form>
    </div>
  )
}