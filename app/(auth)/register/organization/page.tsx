'use client'

import { useActionState } from 'react'
import { registerOrganization, type RegisterOrgState } from './actions'
import Link from 'next/link'

const initialState: RegisterOrgState = {}

export default function RegisterOrganizationPage() {
  const [state, formAction, pending] = useActionState(registerOrganization, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Register your organisation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit for admin review. You'll be notified once approved.
          </p>
        </div>

        {/* General error */}
        {state.errors?.general && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{state.errors.general[0]}</p>
          </div>
        )}

        <form action={formAction} className="space-y-5">

          {/* Org Name */}
          <div>
            <label htmlFor="org_name" className="block text-sm font-medium text-gray-700 mb-1">
              Organisation name
            </label>
            <input
              id="org_name"
              name="org_name"
              type="text"
              placeholder="Green Earth Kenya"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {state.errors?.org_name && (
              <p className="mt-1 text-xs text-red-500">{state.errors.org_name[0]}</p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
              Contact email
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              placeholder="info@greenearth.co.ke"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {state.errors?.contact_email && (
              <p className="mt-1 text-xs text-red-500">{state.errors.contact_email[0]}</p>
            )}
          </div>

          {/* KRA PIN */}
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
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {state.errors?.kra_pin && (
              <p className="mt-1 text-xs text-red-500">{state.errors.kra_pin[0]}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What does your organisation do?"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {state.errors?.password && (
              <p className="mt-1 text-xs text-red-500">{state.errors.password[0]}</p>
            )}
          </div>

          {/* Submit */}
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