'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div>
      <section className=" hero-root hero-section">

        <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', marginBottom: '8px' }}>
          How will you <em>make an impact?</em>
        </h1>

        <p className="hero-subtitle" style={{ marginBottom: '32px' }}>
          Choose how you want to participate in the green movement.
        </p>

        {/* Choice cards */}
        <div >
          <div className="flex gap-4">
            <button className="btn-primary" onClick={() => router.push('/register/user')}>
              <div className="hero-subtitle" style={{ marginBottom: '8px' }}>Individual</div>
              <p >
                Complete simple tasks that build habits to care
              </p>
              <p > and sustain the environment, earn points, and redeem rewards.
              </p>
              <p>Get started</p>
            </button>
            <button className="btn-ghost" onClick={() => router.push('/register/organization')}>
              <div className="hero-subtitle" style={{ marginBottom: '8px' }}>Organization</div>
              <p style={{ marginBottom: '16px' }}>
                Post tasks, reward  and engage your community.
              </p>
              <p >Get started</p>
            </button>
          </div>


        </div>

        <p className="hero-proof-text" style={{ marginTop: '32px', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--hero-green-mid)', fontWeight: 900 }}>
            Sign in
          </Link>
        </p>

      </section>
    </div>
  )
}