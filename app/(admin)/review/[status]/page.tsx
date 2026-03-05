type Props = { params: { status: string } }

const messages: Record<string, { title: string; description: string; color: string }> = {
  verified: {
    title: '✅ Organisation verified',
    description: 'The organisation has been verified and notified by email.',
    color: 'text-green-600',
  },
  rejected: {
    title: '❌ Organisation Rejected',
    description: 'The organisation has been rejected and notified by email.',
    color: 'text-red-600',
  },
  'already-used': {
    title: '⚠️ Link Already Used',
    description: 'This approval link has already been used.',
    color: 'text-yellow-600',
  },
  expired: {
    title: '⏰ Link Expired',
    description: 'This link has expired. Please review the organisation manually in Supabase.',
    color: 'text-yellow-600',
  },
  'already-reviewed': {
    title: '📋 Already Reviewed',
    description: 'This organisation has already been reviewed.',
    color: 'text-blue-600',
  },
  invalid: {
    title: '❌ Invalid Link',
    description: 'This link is invalid or malformed.',
    color: 'text-red-600',
  },
  error: {
    title: '❌ Something Went Wrong',
    description: 'An unexpected error occurred. Please try again or check Supabase directly.',
    color: 'text-red-600',
  },
}

export default function ReviewStatusPage({ params }: Props) {
  const content = messages[params.status] ?? messages.invalid

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow p-10 max-w-md w-full text-center">
        <h1 className={`text-2xl font-bold mb-3 ${content.color}`}>
          {content.title}
        </h1>
        <p className="text-gray-600">{content.description}</p>
      </div>
    </div>
  )
}
