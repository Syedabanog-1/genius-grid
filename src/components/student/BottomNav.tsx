'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, BarChart2, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function NavIcon({
  icon: Icon,
  active,
  onClick,
  danger,
}: {
  icon: React.ElementType
  active: boolean
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 flex flex-col items-center justify-center transition-colors group"
    >
      <Icon
        className={`w-6 h-6 transition-all duration-300 ${
          danger
            ? 'text-red-400 group-hover:text-red-500'
            : active
            ? 'text-primary scale-110'
            : 'text-gray-400 group-hover:text-gray-600 dark:text-slate-500 dark:group-hover:text-slate-300'
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
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-[0_-8px_30px_rgba(49,16,143,0.06)]">
      <div className="max-w-2xl mx-auto px-8 py-4 flex justify-between items-center">
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
          icon={LogOut}
          active={false}
          onClick={handleLogout}
          danger
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
