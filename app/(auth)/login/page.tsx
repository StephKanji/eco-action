'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { login, LoginState } from './action'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

const initialState: LoginState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <div>

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
          background: 'rgba(253, 246, 227, 0.8)',
          zIndex: 1,
        }} />

        <div className='hero-section'>

          <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', marginBottom: '8px' }}>
            Login To Your Account; <em>let's heal the planet.</em>
          </h1>
          <p> log in as user, organization or admin</p>

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
                placeholder="username@email.com"
              />
              {state.errors?.email && (
                <p className="text-xs text-red-500 mt-1">{state.errors.email[0]}</p>
              )}
            </div>

            <div>
              <label className="input-label">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="security key"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#6b7280',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
    </div>
  )
}