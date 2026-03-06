'use client'

import { useActionState } from 'react'
import { login, LoginState } from './action'
import Image from 'next/image'
const initialState: LoginState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
<div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

    {/* Background video */}
    <video
      src="/heroclip.mp4"
      autoPlay
      loop
      muted
      playsInline
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0,
      }}
    />

    {/* Dark overlay so text stays readable */}
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(121, 189, 133, 0.71)',
      zIndex: 1,
    }} />

    <div className="hero-section">
  
        <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', marginBottom: '8px' }}>
          Login To Your Account<br />
          <em>let's heal the planet.</em>
        </h1>

        <form action={formAction} className="space-y-4">
          {state.errors?.general && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              {state.errors.general[0]}
            </p>
          )}

          <div>
            <label className="input-label">
              Email
            </label>
            <input
              name="email"
              type="email"
              className="input"
            />
            {state.errors?.email && (
              <p className="text-xs text-red-500 mt-1">{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="input-label">
              Password
            </label>
            <input
              name="password"
              type="password"
              className="input"
            />
            {state.errors?.password && (
              <p className="text-xs text-red-500 mt-1">{state.errors.password[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full btn btn-ghost"
          >
            {pending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      
    </div>
    </div>
  )
}
