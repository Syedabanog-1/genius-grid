'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, User, BadgeCheck, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [giaicId, setGiaicId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const friendlyError = (msg: string) => {
    if (msg.toLowerCase().includes('user already registered')) return 'An account with this email already exists. Try signing in instead.'
    if (msg.toLowerCase().includes('password should be')) return 'Password must be at least 6 characters.'
    if (msg.toLowerCase().includes('invalid email')) return 'Please enter a valid email address.'
    if (msg.toLowerCase().includes('too many requests')) return 'Too many attempts. Please wait a moment and try again.'
    if (msg.toLowerCase().includes('email rate limit')) return 'Too many sign-up attempts with this email. Please try again later.'
    return msg
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, giaic_id: giaicId.trim() || null } },
    })

    if (signUpError) {
      setError(friendlyError(signUpError.message))
      setLoading(false)
      return
    }

    // Supabase returns no error but null user when email already exists (confirmation mode)
    if (!data?.user) {
      setError('An account with this email already exists. Try signing in instead.')
      setLoading(false)
      return
    }

    router.push('/home')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-appbg px-6 py-12 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-24 w-56 h-56 bg-pink-300/10 rounded-full blur-2xl pointer-events-none" />

      {/* Centered content block */}
      <div className="w-full max-w-sm z-10">
        <div className="mb-8">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Genius Grid</p>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Create Account</h1>
          <p className="text-slate-500 text-lg">Join GIAIC&apos;s AI knowledge platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 bg-white border-0 rounded-2xl text-slate-800 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
              placeholder="Full Name"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 bg-white border-0 rounded-2xl text-slate-800 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
              placeholder="Email Address"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-12 pr-12 py-4 bg-white border-0 rounded-2xl text-slate-800 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
              placeholder="Password (min. 6 characters)"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <BadgeCheck className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={giaicId}
              onChange={(e) => setGiaicId(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 bg-white border-0 rounded-2xl text-slate-800 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
              placeholder="GIAIC ID (optional)"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center shadow-soft hover:bg-primaryHover transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
            {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
          </button>
        </form>

        {/* Footer link — grouped with the form, not pinned to page bottom */}
        <p className="mt-8 text-center text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:text-primaryHover">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
