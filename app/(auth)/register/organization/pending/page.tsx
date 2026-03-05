import Link from 'next/link'
export default function OrgPendingPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white rounded-xl shadow p-10 max-w-md w-full text-center space-y-4">
                <div className="text-5xl">⏳</div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Registration Under Review
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Your organisation has been registered successfully. Our team is
                    reviewing your details and you will receive an email once a decision
                    has been made.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                    <p className="text-yellow-800 text-sm font-medium">What happens next?</p>
                    <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                        <li>→ Admin reviews your KRA PIN and organisation details</li>
                        <li>→ You receive an approval or rejection email</li>
                        <li>→ Once approved, you can log in and access your dashboard</li>
                    </ul>
                </div>
                <p className="text-xs text-gray-400">
                    Questions? Contact{' '}
                    <a href="mailto:support@ecotrack.com" className="underline">
                        support@ecotrack.com
                    </a>
                </p>
                <Link
                                href="/login"
                                className="inline-block mt-4 text-sm text-green-600 hover:underline"
                            >
                                Back to sign in
                            </Link>
            </div>
        </div>
    )
}