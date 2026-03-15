'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export const LogoutButton = () => {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50
                 border border-transparent hover:border-red-200 transition-colors
                 px-3 py-1.5 rounded-full text-sm font-medium"
    >
      Logout
    </button>
  )
}