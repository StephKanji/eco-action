import { Suspense } from 'react'
import CompleteOrgForm from './complete-org-form'

export default function RegisterOrganizationPage() {
  return (
    <Suspense fallback={null}>
      <CompleteOrgForm />
    </Suspense>
  )
}