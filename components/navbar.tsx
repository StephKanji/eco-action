import Image from "next/image"
import Link from "next/link"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from './LogoutButton'

const TIER_LABELS: Record<number, { label: string; icon: string; color: string }> = {
  1: { label: 'Seedling',  icon: '🌱', color: 'text-green-700'   },
  2: { label: 'Sprout',    icon: '🌿', color: 'text-lime-700'    },
  3: { label: 'Guardian',  icon: '🛡️', color: 'text-yellow-700'  },
  4: { label: 'Champion',  icon: '🏆', color: 'text-orange-700'  },
  5: { label: 'EcoLegend', icon: '🌍', color: 'text-emerald-700' },
}

export const Navbar = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let org     = null
  let tierRow = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, display_name, created_at')
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

    if (profile?.role === 'user') {
      const { data: userData } = await supabase
        .from('users')
        .select('tier_id')
        .eq('id', user.id)
        .single()
      tierRow = userData
    }
  }

  const isUser = profile?.role === 'user'
  const isOrg  = profile?.role === 'org'

  // Only show the profile pill once a role has actually been assigned —
  // an authenticated user mid-flow on /redirect (no profile row yet), or
  // an admin (no dedicated frontend surface yet), gets Logout only.
  const showProfilePill = isUser || isOrg

  const displayName  = isOrg
    ? org?.org_name ?? 'Organisation'
    : profile?.display_name ?? 'Profile'

  const profileHref  = isOrg ? '/overview' : '/profile'
  const initial      = displayName[0]?.toUpperCase() ?? '?'

  const memberSince  = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-KE', {
        month: 'short', year: 'numeric',
      })
    : null

  const tier = isUser ? (TIER_LABELS[tierRow?.tier_id ?? 1] ?? TIER_LABELS[1]) : null

  return (
    <nav className="w-full fixed top-0 left-0 right-0 z-50">
      <header className="hero-header bg-transparent p-15">

        {/* Logo */}
        <Link href="/" className="flex items-center logo">
          <Image src="/nobglogo2.png" alt="EcoTrack Logo" width={100} height={100} />
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {showProfilePill && (
                <Link
                  href={profileHref}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl
                             bg-green-50 border border-green-200 hover:bg-green-100
                             transition-colors group"
                >
                  {/* Avatar initial */}
                  <span
                    className="w-7 h-7 rounded-full bg-green-600 text-white text-xs
                               font-bold flex items-center justify-center shrink-0"
                  >
                    {initial}
                  </span>

                  {/* Name + meta — hidden on very small screens */}
                  <div className="hidden sm:flex flex-col leading-tight">
                    <span className="text-sm font-medium text-green-800 max-w-[120px] truncate">
                      {displayName}
                    </span>

                    {isUser && tier && (
                      <span className={`text-xs font-medium ${tier.color}`}>
                        {tier.icon} {tier.label}
                        {memberSince && (
                          <span className="text-gray-400 font-normal"> · {memberSince}</span>
                        )}
                      </span>
                    )}

                    {isOrg && memberSince && (
                      <span className="text-xs text-gray-400">
                        Since {memberSince}
                        {org?.verification_status === 'pending'  && <span className="ml-1 text-yellow-500">⏳</span>}
                        {org?.verification_status === 'verified' && <span className="ml-1 text-green-500">✓</span>}
                      </span>
                    )}
                  </div>

                  {/* Mobile: just show verification status dot for orgs */}
                  {isOrg && (
                    <span className="sm:hidden text-xs">
                      {org?.verification_status === 'pending'  && '⏳'}
                      {org?.verification_status === 'verified' && '✓'}
                    </span>
                  )}
                </Link>
              )}

              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/register/user" className="btn-ghost">Sign up</Link>
              <Link href="/login"    className="btn-ghost">Login</Link>
            </>
          )}
        </div>

      </header>
    </nav>
  )
}