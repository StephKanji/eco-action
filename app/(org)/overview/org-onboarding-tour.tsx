'use client'

import { useEffect, useState } from 'react'

const TOUR_STEPS = [
  {
    title: 'Welcome to your Organizations Dashboard',
    description:
      "This is where you create tasks, purchase points and approve tasks submissions. Let's walk through the essentials; it takes less than a minute.",
  },
  {
    title: 'Your stats at a glance',
    description:
      'The three cards up top show how many tasks submissions are pending, verified, or rejected. Click any card to view the full list of tasks in that category.',
  },
  {
    title: 'Your Points',
    description:
      'View your current points balance and those locked for pending tasks; Purchase more points on the "Purchase Points" button at the top right.',
  },
  {
    title: 'Create tasks',
    description:
      'Create tasks for individual participants and community challenges.',
  },
]

const STORAGE_KEY = 'gs_org_tour_shown_count'
const MAX_SHOWS = 3

export default function OrgOnboardingTour() {
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