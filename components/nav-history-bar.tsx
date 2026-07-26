// components/nav-history-bar.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

const STORAGE_KEY = 'gs_nav_visited_count'

export function NavHistoryBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    // Count how many distinct navigations have happened this tab session.
    // We only need a count, not a full stack, since there's no forward
    // to reconstruct — router.back() lets the browser handle that part.
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const count = raw ? Number(raw) : 0
    const newCount = count + 1
    sessionStorage.setItem(STORAGE_KEY, String(newCount))

    setCanGoBack(newCount > 1)
  }, [pathname])

  function handleBack() {
    router.back()
  }

  if (!canGoBack) return null

  return (
    <div
      className="fixed mt-15 z-40 flex items-center"
      style={{ top: 'calc(var(--navbar-h) + 12px)', left: '16px' }}
    >
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors bg-white/90 backdrop-blur-sm shadow-md border border-gray-200"
      >
        <ChevronLeft size={18} />
      </button>
    </div>
  )
}