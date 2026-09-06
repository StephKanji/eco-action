import {Navbar} from "@/components/navbar"
import {NavHistoryBar} from "@/components/nav-history-bar"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 justify-center">
      <NavHistoryBar/>
      {children}
    </div>
  )
}