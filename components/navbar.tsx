import Image from "next/image"
import Link from "next/link"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from './LogoutButton'

export const Navbar = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let org = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, display_name')
      .eq('id', user.id)
      .single()
    profile = data

    if (profile?.role === 'org') {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('org_name, verification_status')
        .eq('profile_id', user.id)
        .single()
      org = orgData
    }
  }

  const isUser = profile?.role === 'user'
  const isOrg = profile?.role === 'org'

  const displayName = isOrg
    ? org?.org_name ?? 'Organisation'
    : profile?.display_name ?? 'Profile'

  const profileHref = isOrg ? '/org' : '/profile'

  const initial = displayName[0]?.toUpperCase() ?? '?'

  return (
    <nav className="w-full">
      <header className="hero-header">
        <Link href="/" className="flex items-center logo">
          <Image src="/nobglogo2.png" alt="GreenSteps Logo" width={100} height={100} />
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Avatar + name link */}
              <Link
                href={profileHref}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full
                           bg-green-50 border border-green-200 hover:bg-green-100
                           transition-colors text-sm font-medium text-green-800"
              >
                <span
                  className="w-7 h-7 rounded-full bg-green-600 text-white text-xs
                             font-bold flex items-center justify-center shrink-0"
                >
                  {initial}
                </span>
                <span className="max-w-[120px] truncate hidden sm:block">
                  {displayName}
                </span>
                {isOrg && org?.verification_status === 'pending' && (
                  <span className="text-yellow-500 text-xs">⏳</span>
                )}
                {isOrg && org?.verification_status === 'verified' && (
                  <span className="text-green-500 text-xs">✓</span>
                )}
              </Link>

              {/* Logout */}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/register" className="btn-ghost">
                Sign up
              </Link>
              <Link href="/login" className="btn-ghost">
                Login
              </Link>
            </>
          )}
        </div>
      </header>
    </nav>
  )
}