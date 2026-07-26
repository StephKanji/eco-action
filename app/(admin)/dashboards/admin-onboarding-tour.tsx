'use client'

import { useEffect, useState } from 'react'

const TOUR_STEPS = [
  {
    title: 'Welcome to the Admin Dashboard',
    description:
      "This is where you review organisation registrations and keep an eye on the platform's points ledger. Let's walk through the essentials — takes less than a minute.",
  },
  {
    title: 'Your stats at a glance',
    description:
      'The three cards up top show how many organisations are pending, verified, or rejected — updated live, no refresh needed.',
  },
  {
    title: 'Reviewing new organisations',
    description:
      'Every pending organisation appears as a card below with their full details. Approve or reject right from the card — rejections let you leave a reason for the organisation.',
  },
  {
    title: 'Tracking every transaction',
    description:
      'Use "View Transactions" in the top right any time to see the full points ledger — purchases, escrow moves, and redemptions, all in one place.',
  },
]

const STORAGE_KEY = 'gs_admin_tour_shown_count'
const MAX_SHOWS = 3

export default function AdminOnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const shownCount = Number(localStorage.getItem(STORAGE_KEY) ?? '0')
    if (shownCount < MAX_SHOWS) {
      setVisible(true)
      localStorage.setItem(STORAGE_KEY, String(shownCount + 1))
    }
  }, [])

  function handleNext() {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      setVisible(false)
    }
  }

  function handleSkip() {
    setVisible(false)
  }

  if (!visible) return null

  const current = TOUR_STEPS[step]
  const isLastStep = step === TOUR_STEPS.length - 1

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true">
      <div className="tour-card">
        <p className="tour-step-label">
          Step {step + 1} of {TOUR_STEPS.length}
        </p>
        <h3 className="tour-title">{current.title}</h3>
        <p className="tour-description">{current.description}</p>

        <div className="tour-dots">
          {TOUR_STEPS.map((_, i) => (
            <span key={i} className={`tour-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="tour-actions">
          <button type="button" className="tour-skip-btn" onClick={handleSkip}>
            Skip
          </button>
          <button type="button" className="tour-next-btn" onClick={handleNext}>
            {isLastStep ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}