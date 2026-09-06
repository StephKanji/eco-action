// app/(auth)/login/login-form.tsx
'use client'

import { useState , useActionState} from 'react'
import { useSearchParams } from 'next/navigation'
import { login, LoginState } from './action'
import { Eye, EyeOff } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

const initialState: LoginState = {}

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const accountExistsMessage = searchParams.get('message') === 'account_exists'
  const noAccountError = searchParams.get('error') === 'no_account'

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?type=login`,
      },
    })
  }

  return (
    <div>
      <div>
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

        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(253, 246, 227, 0.8)',
          zIndex: 1,
        }} />

        <div className='hero-section pt-5'>

          <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', marginBottom: '8px' }}>
            Login To Your Account; <em>let's heal the planet.</em>
          </h1>
          <p> log in as user, organization or admin</p>

          {accountExistsMessage && (
            <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-3">
              An account with this email already exists. Please sign in below.
            </p>
          )}

          {noAccountError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              No account found for that Google login. Please sign up first.
            </p>
          )}

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

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 btn btn-ghost flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Continue with Google
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}