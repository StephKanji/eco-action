'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { uploadProof } from '@/lib/upload-proof'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import Image from 'next/image'

export default function SubmitProofPage() {
  const params = useParams()
  const taskId = params.id as string
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('Only JPG, PNG and WebP images are allowed')
      return
    }

    // Validate size (10MB max)
    if (selected.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB')
      return
    }

    setError('')
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  async function handleSubmit() {
    if (!file) { setError('Please select a photo first'); return }
    setUploading(true)
    setError('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated'); setUploading(false); return }

      // Upload to Supabase Storage
      const { url, error: uploadError } = await uploadProof(file, user.id, taskId)
      if (uploadError) { setError(uploadError); setUploading(false); return }

      // Submit to API
      const res = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          proof_url: url,
          proof_metadata: {
            filename: file.name,
            size: file.size,
            type: file.type,
            uploaded_at: new Date().toISOString(),
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Submission failed')
        setUploading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/usertasks'), 2500)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 mt-50 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Proof Submitted!
        </h1>
        <p className="text-gray-500 text-sm">
          Your submission is under review. You'll be notified when it's approved.
        </p>
        <p className="text-xs text-gray-400 mt-4">Redirecting to tasks...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-2 px-4">

      <div className=" space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Proof</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload a clear photo showing your completed task
          </p>
        </div>

        {/* Upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed cursor-pointer
                      transition-all duration-200 overflow-hidden
                      ${preview
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-200 hover:border-green-400 hover:bg-green-50'}`}
        >
          {preview ? (
            <div className="relative h-72">
              <Image
                src={preview}
                alt="Proof preview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center 
                              justify-center opacity-0 hover:opacity-100 transition-opacity">
                <p className="text-white text-sm font-medium">Click to change</p>
              </div>
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <span className="text-5xl">📷</span>
              <p className="text-sm font-medium">Click to upload photo</p>
              <p className="text-xs">JPG, PNG, WebP — max 10MB</p>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* File info */}
        {file && (
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500">
              📎 {file.name} — {(file.size / 1024 / 1024).toFixed(2)}MB
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="w-full py-3 px-6 rounded-xl bg-green-600 text-white font-semibold
                     hover:bg-green-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Uploading...
            </span>
          ) : 'Submit Proof'}
        </button>

        <Link
        href={`/usertasks/${taskId}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Explore more Tasks
      </Link>
      </div>
    </div>
  )
}