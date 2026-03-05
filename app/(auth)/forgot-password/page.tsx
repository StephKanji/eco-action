'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }

    setPending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-6">
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <Link href="/login" className="text-green-600 text-sm font-medium hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <Image src="/nobglogo1.png"
                alt="GreenSteps Logo"
                width={100} height={100} />
              <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  className="input"
                />
              </div>

              <button
                type="submit"
                disabled={pending || !email}
                className="btn btn-ghost w-full"
              >
                {pending ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-green-600 font-medium hover:underline">
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}