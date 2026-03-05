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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setErrors({})

    const form = new FormData(e.currentTarget)
    const org_name      = form.get('org_name') as string
    const contact_email = form.get('contact_email') as string
    const kra_pin       = form.get('kra_pin') as string
    const description   = form.get('description') as string
    const password      = form.get('password') as string

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

    // Email confirmations disabled (dev) — session returned immediately
    // Create profile + org rows via API route using admin client
    if (data.session && data.user) {
      const res = await fetch('/api/send-org-email', {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        <div className="mb-8">
          <Image src="/nobglogo2.png" alt="greenSpoon.logo" width={50} height={50} />
          <h1 className="page-title">Register your organisation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit for admin review. You'll be notified once verified.
          </p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="org_name" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="kra_pin" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
            {pending ? 'Submitting...' : 'Submit for review'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-green-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}