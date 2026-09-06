'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SettingsFormProps {
  userId: string
  email: string
  role: 'user' | 'org' | 'admin' | null
  displayName: string
  orgName: string
  orgDescription: string
}

export function SettingsForm({
  userId, email, role, displayName, orgName, orgDescription,
}: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(displayName)
  const [orgNameField, setOrgNameField] = useState(orgName)
  const [orgDescField, setOrgDescField] = useState(orgDescription)

  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [loggingOut, setLoggingOut] = useState(false)

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSaveMessage(null)
    setSaveError(null)

    // Editing own row directly via the browser client — assumes RLS lets a
    // user update their own profiles/organizations row (auth.uid() = id /
    // profile_id). If that policy isn't in place yet, this will fail with
    // a permissions error and needs a server route with the admin client
    // instead.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ display_name: role === 'org' ? orgNameField : name })
      .eq('id', userId)

    if (profileError) {
      setSaveError(profileError.message)
      setSaving(false)
      return
    }

    if (role === 'org') {
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ org_name: orgNameField, description: orgDescField })
        .eq('profile_id', userId)

      if (orgError) {
        setSaveError(orgError.message)
        setSaving(false)
        return
      }
    }

    setSaveMessage('Saved.')
    setSaving(false)
    router.refresh()
  }

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)

    const res = await fetch('/api/account/delete', { method: 'POST' })

    if (!res.ok) {
      const err = await res.json()
      setDeleteError(err.error ?? 'Failed to delete account. Please try again.')
      setDeleting(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="space-y-8" style={{ maxWidth: '480px', width: '100%' }}>

      <div>
        <h1 className="hero-title" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', marginBottom: '6px' }}>
          Account <em>settings</em>
        </h1>
        <p className="hero-subtitle">{email}</p>
      </div>

      {/* Edit profile */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        {role === 'org' ? (
          <>
            <div>
              <label className="input-label">Organisation name</label>
              <input
                type="text"
                value={orgNameField}
                onChange={e => setOrgNameField(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="input-label">Description</label>
              <textarea
                value={orgDescField}
                onChange={e => setOrgDescField(e.target.value)}
                rows={3}
                className="input"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="input-label">Display name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
            />
          </div>
        )}

        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{saveError}</p>
        )}
        {saveMessage && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">{saveMessage}</p>
        )}

        <button type="submit" disabled={saving} className="w-full py-2.5 px-4 btn btn-ghost">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      {/* Logout */}
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full py-2.5 px-4 btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50
                     border border-transparent hover:border-red-200 transition-colors rounded-full"
        >
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      {/* Delete account */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        <p className="text-xs text-gray-400">
          Deleting your account permanently removes your profile and all associated data. This can't be undone.
        </p>

        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="w-full py-2.5 px-4 btn-ghost text-red-600 border border-red-200 hover:bg-red-50 rounded-full"
          >
            Delete account
          </button>
        ) : (
          <div className="space-y-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">
              Type <span className="font-semibold">DELETE</span> to confirm. This is permanent.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              className="input"
              placeholder="DELETE"
            />
            {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 py-2 px-4 btn-ghost text-white bg-red-600 hover:bg-red-700
                           disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
              >
                {deleting ? 'Deleting...' : 'Permanently delete'}
              </button>
              <button
                onClick={() => { setConfirmingDelete(false); setDeleteConfirmText(''); setDeleteError(null) }}
                className="flex-1 py-2 px-4 btn-ghost rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}