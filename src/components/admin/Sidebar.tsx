'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  ListChecks,
  Users,
  LogOut,
  HelpCircle,
  Upload,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/categories', label: 'Categories', icon: BookOpen },
  { href: '/admin/quizzes', label: 'Quizzes', icon: ListChecks },
  { href: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/import', label: 'Import Quiz', icon: Upload },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">GG</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800">Genius Grid</h1>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                active
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-slate-600 hover:bg-gray-50 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
