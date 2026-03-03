'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'


export default function RegisterPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Image
            src="/nobglogo2.png"
            alt="greenspoonlogo.png"
            width={200}
            height={200}
          />

          <p className="text-sm text-gray-500 mt-1">Choose how you want to participate</p>
        </div>
        <div className="grid gap-4">
          {/* User card */}

          <button
            type="button"
            onClick={() => router.push('/register/user')}
            className="btn btn-primary mt-3">
            <div className="flex items-start gap-4">
              <div>
                <h2 className="font-semibold -translate-x-5 text-gray-900">
                  Individual
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Complete eco tasks, earn points, and redeem rewards
                </p>
              </div>
            </div>
          </button>

          {/* Org card */}
          <button
            type="button"
            onClick={() => router.push('/register/organization')}
            className="btn btn-primary mt-3">
            <div className="flex items-start gap-4">
              <div>
                <h2 className="font-semibold -translate-x-5 text-gray-900">
                  Organization
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Post tasks, run challenges, and engage your community
                </p> </div> </div>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-green-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}