// app/(admin)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { NavHistoryBar } from '@/components/nav-history-bar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/login')
  }

  return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <Navbar />
        <NavHistoryBar />
        {/* FIX: added <main> wrapper with page-content — previously children
            rendered with no wrapper at all, sitting flush under the fixed navbar */}
        <main className="page-content">
          {children}
        </main>
      </div>
    )
}
