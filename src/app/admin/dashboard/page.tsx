export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatsCard from '@/components/admin/StatsCard'
import { BookOpen, ListChecks, Users, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [
    { count: quizCount },
    { count: categoryCount },
    { count: studentCount },
    { count: attemptCount },
    { data: recentQuizzes },
    { data: recentAttempts },
  ] = await Promise.all([
    supabase.from('quizzes').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('is_completed', true),
    supabase
      .from('quizzes')
      .select('*, category:categories(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('quiz_attempts')
      .select('*, profile:profiles(full_name), quiz:quizzes(title)')
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(5),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your quiz platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Quizzes"
          value={quizCount ?? 0}
          icon={ListChecks}
          color="text-primary"
          bgColor="bg-violet-50"
        />
        <StatsCard
          title="Categories"
          value={categoryCount ?? 0}
          icon={BookOpen}
          color="text-pink-500"
          bgColor="bg-pink-50"
        />
        <StatsCard
          title="Students"
          value={studentCount ?? 0}
          icon={Users}
          color="text-blue-500"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Completed Attempts"
          value={attemptCount ?? 0}
          icon={Activity}
          color="text-green-500"
          bgColor="bg-green-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Recent Quizzes</h2>
            <Link href="/admin/quizzes" className="text-sm font-bold text-primary hover:text-primaryHover">
              View all
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {(recentQuizzes ?? []).length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No quizzes yet</p>
            ) : (
              (recentQuizzes ?? []).map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/admin/quizzes/${quiz.id}`}
                  className="flex items-center justify-between hover:bg-gray-50 p-3 rounded-xl transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{quiz.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{(quiz as any).category?.name ?? 'No category'}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      quiz.is_published ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'
                    }`}
                  >
                    {quiz.is_published ? 'Published' : 'Draft'}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Attempts */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Recent Attempts</h2>
            <Link href="/admin/students" className="text-sm font-bold text-primary hover:text-primaryHover">
              View all
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {(recentAttempts ?? []).length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No attempts yet</p>
            ) : (
              (recentAttempts ?? []).map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {(attempt as any).profile?.full_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{(attempt as any).quiz?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-sm">
                      {attempt.score}/{attempt.total_questions}
                    </p>
                    <p className="text-xs text-slate-400">+{attempt.points_earned} pts</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
