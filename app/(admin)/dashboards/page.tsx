import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OrgApprovalCard from './OrgApprovalCard'

export default async function OrganizationsPage() {
  const adminClient = createAdminClient()

  // Fetch all orgs with their profile info
  const { data: organizations, error } = await adminClient
    .from('organizations')
    .select(`
      id,
      org_name,
      contact_email,
      kra_pin,
      description,
      verification_status,
      created_at,
      profile_id
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-600 text-sm">
        Failed to load organisations: {error.message}
      </div>
    )
  }

  const pending = organizations?.filter(o => o.verification_status === 'pending') ?? []
  const verified = organizations?.filter(o => o.verification_status === 'verified') ?? []
  const rejected = organizations?.filter(o => o.verification_status === 'rejected') ?? []

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organisations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and approve organisation registrations
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-700 font-medium">Pending review</p>
          <p className="text-3xl font-bold text-yellow-800 mt-1">{pending.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">Verified</p>
          <p className="text-3xl font-bold text-green-800 mt-1">{verified.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 font-medium">Rejected</p>
          <p className="text-3xl font-bold text-red-800 mt-1">{rejected.length}</p>
        </div>
      </div>

      {/* Pending section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
          Pending Approval
        </h2>

        {pending.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm">No pending organisations 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(org => (
              <OrgApprovalCard key={org.id} org={org} />
            ))}
          </div>
        )}
      </section>

      {/* Verified section */}
      {verified.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Verified
          </h2>
          <div className="space-y-4">
            {verified.map(org => (
              <OrgApprovalCard key={org.id} org={org} />
            ))}
          </div>
        </section>
      )}

      {/* Rejected section */}
      {rejected.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            Rejected
          </h2>
          <div className="space-y-4">
            {rejected.map(org => (
              <OrgApprovalCard key={org.id} org={org} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}