import { Suspense } from 'react'
import CreateAccountForm from './create-account-form.tsx'

export default function CreateAccountPage() {
  return (
    <Suspense fallback={null}>
      <CreateAccountForm />
    </Suspense>
  )
}