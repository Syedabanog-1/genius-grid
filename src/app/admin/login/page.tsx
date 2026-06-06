'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const friendlyError = (msg: string) => {
    if (msg.toLowerCase().includes('invalid login credentials')) return 'Incorrect email or password.'
    if (msg.toLowerCase().includes('too many requests')) return 'Too many attempts. Please wait a moment.'
    return msg
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(friendlyError(signInError.message))
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut()
        setError('Access denied. Admin accounts only.')
        setLoading(false)
        return
      }

      router.push('/admin/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-soft p-8 border border-gray-100">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-soft">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Genius Grid</p>
              <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
              <p className="text-slate-500 text-sm mt-1">Sign in to manage the platform</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white transition-all"
                placeholder="Admin Email"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white transition-all"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center shadow-soft hover:bg-primaryHover transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In to Admin'}
              {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
