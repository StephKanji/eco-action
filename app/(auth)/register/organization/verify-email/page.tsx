import Link from 'next/link'
import Image from 'next/image'

export default function VerifyAccountPage() {
    return (
        <div className="card card-muted">
            <Image src="/brownbgtextlogo.png" alt="Email Verification" width={100} height={100} className="mx-auto" />
            <p className="text-sm text-gray-500">
                We will send a confirmation link to your email once your details have reviewed.
            </p>
            <Link
                href="/login"
                className="inline-block mt-4 text-sm text-green-600 hover:underline"
            >
                Back to sign in
            </Link>
        </div>
    )
}