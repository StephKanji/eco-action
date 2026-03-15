import Link from 'next/link'
import Image from 'next/image'

export default function VerifyAccountPage() {
    return (
        <div className="card">
            <Image src="/whitebgtextlogo.png" alt="Email Verification" width={100} height={100} />
            <p className="text-sm text-gray-500">
                We will send a confirmation link to your email once your details have reviewed.
            </p>
            <Link
                href="/"
                className="inline-block mt-4 text-sm text-green-600 hover:underline"
            >
                Go Back to Home
            </Link>
        </div>
    )
}