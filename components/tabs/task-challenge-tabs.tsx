// components/tabs/task-challenge-tabs.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function TaskChallengeTabs() {
  const pathname = usePathname()
  const isTasks = pathname.startsWith('/usertasks')
  const isChallenges = pathname.startsWith('/challenges')

  return (
    <div
      className="sticky z-30 flex gap-1 p-1 rounded-full bg-gray-100/80 backdrop-blur-sm w-fit mx-auto"
      style={{ top: 'calc(var(--navbar-h) + 12px)' }}
    >
      <Link
        href="/usertasks"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
          ${isTasks
            ? 'bg-white text-green-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'}`}
      >
        Tasks
      </Link>
      <Link
        href="/challenges"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
          ${isChallenges
            ? 'bg-white text-green-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'}`}
      >
        Challenges
      </Link>
    </div>
  )
}