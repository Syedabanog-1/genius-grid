'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, BarChart2, Heart, User } from 'lucide-react'

function NavIcon({
  icon: Icon,
  active,
  onClick,
}: {
  icon: React.ElementType
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 flex flex-col items-center justify-center transition-colors group"
    >
      <Icon
        className={`w-6 h-6 transition-all duration-300 ${
          active ? 'text-primary scale-110' : 'text-gray-400 group-hover:text-gray-600'
        }`}
        strokeWidth={active ? 2.5 : 2}
      />
      {active && (
        <div className="w-1.5 h-1.5 bg-primary rounded-full absolute -bottom-1 shadow-[0_0_8px_rgba(49,16,143,0.6)]" />
      )}
    </button>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-10px_40px_rgba(49,16,143,0.08)]">
    <div className="max-w-2xl mx-auto px-8 py-5 flex justify-between items-center">
      <NavIcon
        icon={Home}
        active={pathname === '/home' || pathname === '/quizzes'}
        onClick={() => router.push('/home')}
      />
      <NavIcon
        icon={BarChart2}
        active={pathname === '/leaderboard'}
        onClick={() => router.push('/leaderboard')}
      />
      <NavIcon
        icon={Heart}
        active={false}
        onClick={() => router.push('/home')}
      />
      <NavIcon
        icon={User}
        active={pathname === '/profile'}
        onClick={() => router.push('/profile')}
      />
    </div>
    </div>
  )
}
