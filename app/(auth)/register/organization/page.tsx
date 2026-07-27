'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterOrganizationPage() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleGoogleSignIn(intendedType: 'user' | 'org') {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?type=${intendedType}`,
        scopes: 'profile email',
      },
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setErrors({})

    const form = new FormData(e.currentTarget)
    const org_name = form.get('org_name') as string
    const contact_email = form.get('contact_email') as string
    const kra_pin = form.get('kra_pin') as string
    const description = form.get('description') as string
    const password = form.get('password') as string

    if (org_name.length < 2) {
      setErrors({ org_name: 'Organisation name must be at least 2 characters' })
      setPending(false)
      return
    }
    if (kra_pin.length !== 11) {
      setErrors({ kra_pin: 'Enter a valid KRA PIN' })
      setPending(false)
      return
    }
    if (password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' })
      setPending(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: contact_email,
      password,
      options: {
        data: { display_name: org_name, kra_pin, description },
        emailRedirectTo: `${window.location.origin}/auth/callback?type=org`,
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
      const res = await fetch('/api/register-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          org_name,
          contact_email,
          kra_pin,
          description,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setErrors({ general: err.error ?? 'Registration failed. Please try again.' })
        setPending(false)
        return
      }

      router.push('/register/organization/pending')
      return
    }

    // Email confirmations enabled — wait for callback
    router.push('/register/organization/verify-email')
  }

  return (
    <div className='hero-section pt-30' >

      <div>
        <h1 className="hero-title" style={{ fontSize: 'clamp(1.2rem, 3vw, 2.1rem)', marginBottom: '6px' }}>
          Register your  <em> Organization</em>
        </h1>
        <p className="hero-subtitle">
          Submit your details for admin review. You'll be notified once verified.
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="org_name" className="input-label">
            Organisation name
          </label>
          <input
            id="org_name"
            name="org_name"
            type="text"
            placeholder="Green Earth Kenya"
            className="input"
          />
          {errors.org_name && (
            <p className="mt-1 text-xs text-red-500">{errors.org_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="contact_email" className="input-label">
            Contact email
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            placeholder="info@greenearth.co.ke"
            className="input"
          />
          {errors.contact_email && (
            <p className="mt-1 text-xs text-red-500">{errors.contact_email}</p>
          )}
        </div>

        <div>
          <label htmlFor="kra_pin" className="input-label">
            KRA PIN
          </label>
          <input
            id="kra_pin"
            name="kra_pin"
            type="text"
            placeholder="A123456789Z"
            maxLength={11}
            className="input"
          />
          {errors.kra_pin && (
            <p className="mt-1 text-xs text-red-500">{errors.kra_pin}</p>
          )}
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

        <div>
          <label htmlFor="password" className="input-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
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
          {pending ? 'Submitting...' : ' Create account'}
        </button>

        <button
          type="button"
          onClick={() => handleGoogleSignIn('org')}
          className="w-full py-2.5 px-4 btn btn-ghost flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          Continue with Google
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500 pb-10">
        <p>
          Already have an account?{' '}
          <Link href="/login" className="text-green-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}