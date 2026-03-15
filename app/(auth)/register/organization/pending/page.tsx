import Link from 'next/link'
export default function OrgPendingPage() {
    return (
        <div className="card">
            <div>
                <h1 className="hero-title" style={{ fontSize: 'clamp(1.6rem, 3vw, 3.0rem)', marginBottom: '6px' }}>
                    Your registration is<em> Under Review</em>
                </h1>
                <p className="hero-subtitle">
                   We reviewing your details and you will receive an email once a decision
                    has been made.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                    <p className="text-yellow-800 text-sm font-medium">What happens next?</p>
                    <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                        <li> Admin reviews your KRA PIN and organisation details</li>
                        <li> You receive an approval or rejection email</li>
                        <li> Once approved, you can log in and access your dashboard</li>
                    </ul>
                </div>
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