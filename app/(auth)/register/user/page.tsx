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

    if (data.session) {
      router.push('/profile')
      return
    }

    router.push('/register/user/verify-email')
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow p-8 space-y-6">
      <div>
        <div className="flex">
          <Image src="/nobglogo1.png" alt="greenspoon.logo" width={100} height={100} />
          <h1 className="page-title">Create your account</h1>
        </div>
        <p className="page-subtitle mt-1">
          Already have an account?{' '}
          <Link href="/login" className="text-brown-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {errors.general && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
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

      <p className="text-xs text-center text-gray-400">
        Are you an organization?{' '}
        <Link href="/register/organization" className="text-green-600 hover:underline">
          Register here
        </Link>
      </p>
    </div>
  )
}