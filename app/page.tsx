'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Navbar } from '@/components/navbar'


export default function Home() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 3)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <Navbar />

      {/* Hero section */}
      <section className="hero-section">

        <h1 className="hero-title">
          Every step you take<br />
          <em>heals the planet.</em>
        </h1>

        <p className="hero-subtitle">
          Complete eco-conscious tasks, earn rewards, and join a community of
          changemakers making a real difference — one green step at a time.
        </p>


        {/* CTA */}
        <div className="hero-cta-row">
          <button
            className="hero-btn-primary"
            onClick={() => router.push('/register')}
          >
            Start Your Journey →
          </button>
  
        </div>

        {/* Social proof */}
        <div className="hero-social-proof">
          <div className="hero-avatar-stack">
            <div className="hero-avatar hero-avatar-1">A</div>
            <div className="hero-avatar hero-avatar-2">B</div>
            <div className="hero-avatar hero-avatar-3">C</div>
            <div className="hero-avatar hero-avatar-4">D</div>
          </div>
          <p className="hero-proof-text">
            Join <strong>2,400+</strong> eco-warriors already making a difference
          </p>
        </div>
      </section>
    </div>
  )
}