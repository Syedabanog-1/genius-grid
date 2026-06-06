'use client'

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showBottomNav = ['/home', '/quizzes', '/leaderboard', '/profile'].includes(pathname)

  return (
    <div className="min-h-screen bg-appbg">
      <div className={`max-w-2xl mx-auto ${showBottomNav ? 'pb-24' : ''}`}>
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  )
}
