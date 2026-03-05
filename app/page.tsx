'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen items-center justify-center my-1 -translate-y-10">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-6xl">
        
        {/* Left column: text content */}
        <div className="flex flex-col justify-center">
          <p className="page-subtitle">Welcome to GreenSteps</p>
          <p className="page-subtitle">
            Complete eco-conscious tasks and earn rewards.
            create commmunity, and make a positive impact on the planet. Join us today and take your first step towards a greener future!
          </p>
        </div>

        {/* Right column: image + button */}
        <div className="flex flex-col items-center justify-center">
          <Image
            src="/nobglogo2.png"
            alt="GreenSteps.logo"
            width={200}
            height={200}
          />
          <button
            onClick={() => router.push('/register')}
            className="btn btn-outline mt-6"
          >
            Register Now
          </button>
        </div>
      </div>
    </main>
  )
}
