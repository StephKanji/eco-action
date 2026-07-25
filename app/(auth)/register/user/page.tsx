'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function UserRegisterPage() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setErrors({})

    const form = new FormData(e.currentTarget)
    const display_name = form.get('display_name') as string
    const email = form.get('email') as string
    const password = form.get('password') as string

    if (display_name.length < 2) {
      setErrors({ display_name: 'Name must be at least 2 characters' })
      setPending(false)
      return
    }
    if (password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' })
      setPending(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrors({ general: error.message })
      setPending(false)
      return
    }

   if (data.session && data.user) {
  const res = await fetch('/api/register-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: data.user.id,
      display_name,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    setErrors({ general: err.error ?? 'Registration failed. Please try again.' })
    setPending(false)
    return
  }

  router.push('/profile')
  return
}
  }

  return (
    <div className="hero-section pt-5" >
      
        <div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(1.6rem, 3vw, 3.0rem)', marginBottom: '6px' }}>
            Create your<em> account</em></h1>
        <p className="hero-subtitle">
        make an impact; build your streak
        </p>
        </div>

      {errors.general && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div>
          <label className="input-label">
            Display Name
          </label>
          <input
            name="display_name"
            type="text"
            required
            placeholder="Jane Doe"
            className="input"
          />
          {errors.display_name && (
            <p className="mt-1 text-xs text-red-500">{errors.display_name}</p>
          )}
        </div>

        <div>
          <label className="input-label">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="username@example.com"
            className="input"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="input-label">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            placeholder="Min. 8 characters"
            className="input"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 px-4 btn btn-ghost"
        >
          {pending ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="hero-subtitle">
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--hero-green-mid)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>

    </div>
  )
}