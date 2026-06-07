'use client'

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'

const NAV_PATHS = ['/home', '/quizzes', '/leaderboard', '/profile']

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showBottomNav = NAV_PATHS.includes(pathname)

  if (showBottomNav) {
    // Flex-column layout: content scrolls, nav stays pinned at bottom
    return (
      <div className="h-screen flex flex-col bg-appbg dark:bg-slate-900 overflow-hidden">
        <main className="flex-1 overflow-y-auto overscroll-y-contain">
          <div className="max-w-2xl mx-auto w-full">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // Pages without nav (onboarding, login, signup, quiz, results…)
  return (
    <div className="min-h-screen bg-appbg dark:bg-slate-900">
      <div className="max-w-2xl mx-auto">
        {children}
      </div>
    </div>
  )
}
