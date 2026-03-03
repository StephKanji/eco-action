'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Image
        src="/nobglogo2.png"
        alt="GreenSteps.logo"
        width={250}
        height={250}
      />
      <h1 className="page-title">Welcome to GreenSteps</h1>
      <p className="page-subtitle">
        Complete eco-concious task and earn rewards
      </p>

      <div
        className="mt-6">
        <button
          onClick={() => router.push('/register')}
          className="btn btn-outline mt-6">
          Register Now
        </button>
      </div>

    </main>
  );
}
