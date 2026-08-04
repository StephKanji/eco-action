import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import AdminOnboardingTour from './admin-onboarding-tour'
import OrgFilterView from './org-filter-view'

export default async function OrganizationsPage() {
  const adminClient = createAdminClient()

  const { data: organizations, error } = await adminClient
    .from('organizations')
    .select(`
      id,
      org_name,
      contact_email,
      description,
      verification_status,
      created_at,
      profile_id
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="hero-root pt-10">
        <div className="p-4 bg-red-50 rounded-lg text-red-600 text-sm">
          Failed to load organisations: {error.message}
        </div>
      </div>
    )
  }

  const orgs = organizations ?? []
  const pendingCount = orgs.filter((o) => o.verification_status === 'pending').length
  const verifiedCount = orgs.filter((o) => o.verification_status === 'verified').length
  const rejectedCount = orgs.filter((o) => o.verification_status === 'rejected').length

  return (
    <div className="space-y-6 hero-root pt-10">
      <AdminOnboardingTour />

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Review and approve organisation registrations</p>
        </div>
        <Link
          href="/transaction-page"
          className="text-xs font-medium px-4 py-2 rounded-full bg-gray-800 text-white shrink-0 hover:bg-gray-700 transition-colors"
        >
          View Transactions
        </Link>
      </div>

      {/* ── Filterable list (dropdown + stat cards + cards) ── */}
      <OrgFilterView
        organizations={orgs}
        pendingCount={pendingCount}
        verifiedCount={verifiedCount}
        rejectedCount={rejectedCount}
      />
    </div>
  )
}