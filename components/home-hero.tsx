'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function HomeHero() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 3)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="w-full hero-root hero-section">
      <h1 className="hero-title">
        Every step you take<br />
        <em>heals the planet.</em>
      </h1>
      <p className="hero-subtitle">
        Complete eco-conscious tasks, earn rewards, and join a community of
        changemakers making a real difference.
      </p>
      <div className="hero-cta-row">
        <button
          className="btn-primary"
          onClick={() => router.push('/register')}
        >
          Start Your Journey
        </button>
      </div>
    </section>
  )
}