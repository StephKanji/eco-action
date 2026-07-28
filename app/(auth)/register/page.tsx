'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function RedirectPage() {
  const router = useRouter()
  const [pending, setPending] = useState<'user' | 'org' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleRoleSelect(role: 'user' | 'org') {
    setPending(role)
    setError(null)

    // The account already exists (created on the previous form, via
    // password signup or Google) — we just need to know who it is so
    // we can attach a role to it.
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Your session expired — please sign in again.')
      setPending(null)
      router.push('/login')
      return
    }

    const display_name = user.user_metadata?.display_name
      ?? user.user_metadata?.full_name
      ?? user.user_metadata?.name
      ?? (role === 'org' ? 'New Organisation' : 'New User')

    const endpoint = role === 'org' ? '/api/register-org' : '/api/register-user'
    const body = role === 'org'
      ? { userId: user.id, org_name: display_name }
      : { userId: user.id, display_name }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? 'Something went wrong — please try again.')
      setPending(null)
      return
    }

    // Individuals land straight on the home page; organisations still
    // need to submit their remaining details (KRA PIN, description, etc.)
    // before their registration is complete.
    router.push(role === 'org' ? '/register/organization' : '/profile')
  }

  return (
    <div>
      <section className=" hero-root hero-section">

        <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', marginBottom: '8px' }}>
          How will you <em>make an impact?</em>
        </h1>

        <p className="hero-subtitle" style={{ marginBottom: '32px' }}>
          Choose how you want to participate in the green movement.
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200" style={{ marginBottom: '16px' }}>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Choice cards */}
        <div >
          <div className="flex gap-4">
            <button
              className="btn-ghost"
              onClick={() => handleRoleSelect('user')}
              disabled={pending !== null}
            >
              <div className="hero-subtitle" style={{ marginBottom: '8px' }}>Individual</div>
              <p style={{ marginBottom: '16px' }}>
                Complete eco-tasks, earn and redeem points.
              </p>

              <p>{pending === 'user' ? 'Setting up...' : 'Get started'}</p>
            </button>
            <button
              className="btn-ghost"
              onClick={() => handleRoleSelect('org')}
              disabled={pending !== null}
            >
              <div className="hero-subtitle" style={{ marginBottom: '8px' }}>Organization</div>
              <p style={{ marginBottom: '16px' }}>
                Post tasks, reward  and engage your community.
              </p>
              <p >{pending === 'org' ? 'Setting up...' : 'Get started'}</p>
            </button>
          </div>


        </div>

        <p className="hero-proof-text" style={{ marginTop: '32px', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--hero-green-mid)', fontWeight: 900 }}>
            Sign in
          </Link>
        </p>

      </section>
    </div>
  )
}