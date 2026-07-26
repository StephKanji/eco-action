import {Navbar} from "@/components/navbar"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 justify-center">
      <Navbar />
      {children}
    </div>
  )
}