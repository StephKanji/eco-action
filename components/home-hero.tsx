'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const STEPS = [
  {
    title: 'Complete a eco-task',
    description: 'Plant a tree and submit proof when you are done.',
  },
  {
    title: 'Earn points',
    description: 'Once approved, points land straight in your wallet.',
  },
  {
    title: 'Redeem rewards',
    description: 'Turn your points into real value: airtime today, with more redemption options on the way.',
  },
]

export function HomeHero() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % STEPS.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="hero-root hero-section items-center justify-center">
      <h1 className="hero-title">
        Every step you take<br />
        <em>heals the planet.</em>
      </h1>
      <p className="hero-subtitle text-align">Join a community of
        changemakers making a real difference.
      </p>
      <div className="hero-cta-row mt-6">
        <button
          className="btn-primary"
          onClick={() => router.push('/register')}
        >
          Start Your Journey
        </button>
      </div>

      {/* ── How It Works ─────────────────────────────── */}
      <div className="mt-12 mb-10 w-full max-w-2xl">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-4">
          How It Works
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STEPS.map((step, i) => {
            const isActive = i === activeStep
            return (
              <div
                key={step.title}
                className="profile-status-chip"
                style={{
                  textAlign: 'left',
                  borderWidth: isActive ? '2px' : '1px',
                  borderColor: isActive ? 'var(--color-accent, #2f7d4f)' : undefined,
                  transition: 'border-color 0.4s ease',
                }}
              >
                <p className="profile-status-lbl">Step {i + 1}</p>
                <p className="font-semibold text-brown mt-1">{step.title}</p>
                <p className="text-xs text-brown/70 mt-1">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}