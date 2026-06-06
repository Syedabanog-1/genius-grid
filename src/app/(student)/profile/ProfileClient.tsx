'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { User, Mail, BadgeCheck, Gem, LogOut, Save, CheckCircle, Trophy, Target, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface Props {
  profile: Profile
  stats: {
    totalAttempts: number
    completedAttempts: number
    avgPercent: number
  }
}

export default function ProfileClient({ profile, stats }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [giaicId, setGiaicId] = useState(profile.giaic_id ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const avatarSeed = profile.avatar_seed ?? profile.email ?? 'default'
  const displayName = profile.full_name?.split(' ')[0] ?? 'Student'

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        giaic_id: giaicId.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-appbg pb-28">
      {/* Header */}
      <div className="bg-primary px-6 pt-14 pb-20 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute top-6 right-24 text-white/10 rotate-12 text-5xl font-bold select-none">?</div>
        <h1 className="text-xl font-bold text-white mb-1 relative z-10">My Profile</h1>
        <p className="text-white/70 text-sm relative z-10">Manage your account</p>
      </div>

      {/* Avatar card — overlaps header */}
      <div className="px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-3xl shadow-soft p-6 flex items-center space-x-5">
          <div className="w-20 h-20 rounded-2xl bg-pink-100 overflow-hidden border-4 border-white shadow-md flex-shrink-0">
            <Image
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=fce7f3`}
              alt="Avatar"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-800 truncate">{profile.full_name ?? 'Student'}</h2>
            <p className="text-sm text-slate-500 truncate">{profile.email}</p>
            <div className="flex items-center space-x-1.5 mt-2">
              <Gem className="w-4 h-4 text-pink-400 fill-pink-100 flex-shrink-0" />
              <span className="text-sm font-bold text-primary">{profile.points} points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 mt-5">
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Trophy className="w-5 h-5 text-amber-500" />}
            bg="bg-amber-50"
            label="Completed"
            value={String(stats.completedAttempts)}
          />
          <StatCard
            icon={<Target className="w-5 h-5 text-primary" />}
            bg="bg-violet-50"
            label="Attempts"
            value={String(stats.totalAttempts)}
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-green-500" />}
            bg="bg-green-50"
            label="Avg Score"
            value={`${stats.avgPercent}%`}
          />
        </div>
      </div>

      {/* Edit form */}
      <div className="px-6 mt-5">
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-800">Edit Profile</h3>

          {/* Full name */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 bg-appbg border-0 rounded-2xl text-slate-800 placeholder-gray-400 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
              placeholder="Full Name"
            />
          </div>

          {/* Email — read only */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-300" />
            </div>
            <input
              type="email"
              value={profile.email ?? ''}
              readOnly
              className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-0 rounded-2xl text-slate-400 text-sm cursor-not-allowed"
            />
          </div>

          {/* GIAIC ID */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <BadgeCheck className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={giaicId}
              onChange={(e) => setGiaicId(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 bg-appbg border-0 rounded-2xl text-slate-800 placeholder-gray-400 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
              placeholder="GIAIC ID (optional)"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium px-1">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center space-x-2 shadow-soft hover:bg-primaryHover transition-colors active:scale-[0.98] disabled:opacity-60"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sign out */}
      <div className="px-6 mt-4">
        <button
          onClick={handleSignOut}
          className="w-full bg-white border border-red-100 text-red-500 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center space-x-2 hover:bg-red-50 transition-colors active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode
  bg: string
  label: string
  value: string
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
        {icon}
      </div>
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
    </div>
  )
}
