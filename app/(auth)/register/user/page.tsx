'use client'

import { useActionState } from 'react'
import { registerUser, type RegisterUserState } from './action'
import Link from 'next/link'

const initialState: RegisterUserState = {}

export default function UserRegisterPage() {
  const [state, formAction, pending] = useActionState(registerUser, initialState)

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow p-8 space-y-6">
      <div>
        <Link
          href="/register"
          className="text-xs text-gray-400 hover:text-gray-600 mb-4 inline-block"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">
          Already have an account?{' '}
          <Link href="/login" className="text-green-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* General error */}
      {state.errors?.general && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{state.errors.general[0]}</p>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            name="display_name"
            type="text"
            required
            placeholder="Jane Doe"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state.errors?.display_name && (
            <p className="mt-1 text-xs text-red-500">{state.errors.display_name[0]}</p>
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
            placeholder="jane@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state.errors?.email && (
            <p className="mt-1 text-xs text-red-500">{state.errors.email[0]}</p>
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {state.errors?.password && (
            <p className="mt-1 text-xs text-red-500">{state.errors.password[0]}</p>
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