import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { packageId } = await request.json()
  if (!packageId) {
    return NextResponse.json({ error: 'packageId is required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Look up the org owned by this profile
  const { data: org } = await adminClient
    .from('organizations')
    .select('id, org_name')
    .eq('profile_id', user.id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Look up the package server-side — never trust a price sent from the client
  const { data: pkg } = await adminClient
    .from('points_packages')
    .select('id, name, points, price_kes')
    .eq('id', packageId)
    .eq('is_active', true)
    .single()

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'kes',
          product_data: { name: `${pkg.name} — ${pkg.points.toLocaleString()} points` },
          unit_amount: Math.round(pkg.price_kes * 100), // Stripe expects the smallest currency unit
        },
        quantity: 1,
      },
    ],
    // Everything the webhook needs later, since it has no session/cookie context
    metadata: {
      org_id: org.id,
      package_id: pkg.id,
      points: String(pkg.points),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/organization/wallet?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/organization/wallet?canceled=true`,
  })

  return NextResponse.json({ url: session.url })
}