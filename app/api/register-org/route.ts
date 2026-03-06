import { createAdminClient } from '@/lib/supabase/admin'
import { type Database } from '@/types/database.types'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        console.log('📥 register-org called with:', body)
        const { userId, role, org_name, contact_email, kra_pin, description } = body

        if (!userId || !org_name || !contact_email || !kra_pin) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const adminClient = createAdminClient()

        // 1. Handle profile — create or fix role
        const { data: existing } = await adminClient
            .from('profiles')
            .select('id, role')
            .eq('id', userId)
            .single()

        if (!existing) {
            const { error: profileError } = await adminClient
                .from('profiles')
                .insert({ id: userId, role: 'org', display_name: org_name })

            if (profileError) {
                console.error('❌ profile insert failed:', profileError.message)
                return NextResponse.json({ error: profileError.message }, { status: 500 })
            }
            console.log('✅ profile created with role: org')
        } else if (existing.role !== 'org') {
            const { error: updateError } = await adminClient
                .from('profiles')
                .update({ role: 'org', display_name: org_name })
                .eq('id', userId)

            if (updateError) {
                console.error('❌ profile role update failed:', updateError.message)
                return NextResponse.json({ error: updateError.message }, { status: 500 })
            }
            console.log('✅ profile role corrected to: org')
        }

        // 2. Handle org row
        const { data: existingOrg } = await adminClient
            .from('organizations')
            .select('id')
            .eq('profile_id', userId)
            .single()

        if (!existingOrg) {
            const { error: orgError } = await adminClient
                .from('organizations')
                .insert({
                    profile_id: userId,
                    org_name,
                    contact_email,
                    kra_pin,
                    description: description ?? null,
                })

            if (orgError) {
                console.error('❌ org insert failed:', orgError.message)
                return NextResponse.json({ error: orgError.message }, { status: 500 })
            }
            console.log('✅ org row created')

            // 3. Generate approval token
            const { data: tokenData, error: tokenError } = await adminClient
                .from('approval_tokens')
                .insert({ org_id: userId })
                .select('token')
                .single()

            if (!tokenError && tokenData) {
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
                await fetch(`${baseUrl}/api/send-admin-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        org_name,
                        contact_email,
                        kra_pin,
                        description: description ?? '',
                        approveUrl: `${baseUrl}/api/admin/review?token=${tokenData.token}&action=approve`,
                        rejectUrl: `${baseUrl}/api/admin/review?token=${tokenData.token}&action=reject`,
                    }),
                })
                console.log('✅ admin notified')
            }
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('register-org error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}