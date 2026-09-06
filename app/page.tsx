import { HomeHero } from '@/components/home-hero'
import { Navbar } from '@/components/navbar'

export default function Home() {
  return (
    <div>
    <Navbar className="bg-white-900" />
      <HomeHero />
    </div>
  )
}