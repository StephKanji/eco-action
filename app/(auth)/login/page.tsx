'use client'

import { useActionState } from 'react'
import { login, LoginState } from './action'

const initialState: LoginState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
<Image src="/nobglogo1" alt="greensteps" height={50} width={50}/>
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Sign In</h1>

        <form action={formAction} className="space-y-4">
          {state.errors?.general && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              {state.errors.general[0]}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {state.errors?.email && (
              <p className="text-xs text-red-500 mt-1">{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {state.errors?.password && (
              <p className="text-xs text-red-500 mt-1">{state.errors.password[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bt btn-ghost"
          >
            {pending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
