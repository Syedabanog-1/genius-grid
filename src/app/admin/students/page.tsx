export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { Users, Gem, BookOpen, CheckCircle } from 'lucide-react'

export default async function StudentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: students } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('points', { ascending: false })

  const studentIds = (students ?? []).map((s) => s.id)

  let attemptsByStudent: Record<string, { total: number; completed: number }> = {}

  if (studentIds.length > 0) {
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('user_id, is_completed')
      .in('user_id', studentIds)

    if (attempts) {
      for (const a of attempts) {
        if (!attemptsByStudent[a.user_id]) {
          attemptsByStudent[a.user_id] = { total: 0, completed: 0 }
        }
        attemptsByStudent[a.user_id].total++
        if (a.is_completed) attemptsByStudent[a.user_id].completed++
      }
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Students</h1>
        <p className="text-slate-500 text-sm mt-1">
          {students?.length ?? 0} registered students
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {(students ?? []).length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No students registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Points</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Attempts</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(students ?? []).map((student, idx) => {
                  const stats = attemptsByStudent[student.id] ?? { total: 0, completed: 0 }
                  const avatarSeed = student.avatar_seed ?? student.email ?? student.id
                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-pink-100 overflow-hidden flex-shrink-0">
                            <Image
                              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=fce7f3`}
                              alt={student.full_name ?? 'Student'}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {student.full_name ?? 'Anonymous'}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">Rank #{idx + 1}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{student.email ?? '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5">
                          <Gem className="w-4 h-4 text-pink-400 fill-pink-100" />
                          <span className="font-bold text-primary text-sm">{student.points}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5 text-sm text-slate-500">
                          <BookOpen className="w-4 h-4" />
                          <span>{stats.total}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5 text-sm text-slate-500">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{stats.completed}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(student.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
