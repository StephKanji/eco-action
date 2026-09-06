'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateAccountForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Role isn't known yet — that's decided on /redirect after the
        // account exists — so this no longer carries a `type` param.
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'profile email',
      },
    })
  }

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

    // Supabase returns a fake/obfuscated user with an empty identities
    // array when the email already belongs to an existing account —
    // intentional, to prevent email enumeration — so detect it this way
    // rather than relying on `error` alone.
    if (data.user && data.user.identities?.length === 0) {
      router.push('/login?message=account_exists')
      return
    }

    if (data.session && data.user) {
      // Account exists now, but role hasn't been chosen yet — that
      // happens on /redirect, which is also responsible for creating
      // the profiles row with the chosen role and sending the user on
      // to /profile or the org-completion form.
      router.push('/register')
      return
    }

    // No session yet — email confirmation is required. There's nothing
    // to redirect into until the user clicks the confirmation link,
    // which lands on /auth/callback and takes it from there.
    setErrors({
      general: 'Check your email to confirm your account before continuing.',
    })
    setPending(false)
  }

  return (
    <div className="hero-section pt-5">

      <div>
        <h1 className="hero-title" style={{ fontSize: 'clamp(1.6rem, 3vw, 3.0rem)', marginBottom: '6px' }}>
          Create your <em>account</em>
        </h1>
        <p className="hero-subtitle">
          Join as a user or an organization
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

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 btn btn-ghost flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          Continue with Google
        </button>
      </form>

      <p className="hero-subtitle pt-5 pb-5">
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--hero-green-mid)', fontWeight: 600 }}>
          Log in
        </Link>
      </p>

    </div>
  )
}