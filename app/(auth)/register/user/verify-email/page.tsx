import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="card">
    <div>
      <h1 className="hero-title" style={{fontSize:'clamp(1.6rem, 3vw, 3.0rem)', marginBottom:'8px'}} >Account created <em> successfully</em></h1>
      <p className="hero-subtitle">
        Login to your account and gain rewards for eco-consious activities
      </p>
      <p className="hero-subtitle">
        Individual Action Matters
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