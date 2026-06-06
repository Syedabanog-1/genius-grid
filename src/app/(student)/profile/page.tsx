export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: attempts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('quiz_attempts')
      .select('id, score, total_questions, points_earned, is_completed, started_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
  ])

  if (!profile) redirect('/login')

  const completed = (attempts ?? []).filter((a) => a.is_completed)
  const totalScore = completed.reduce((sum, a) => sum + (a.score ?? 0), 0)
  const totalQuestions = completed.reduce((sum, a) => sum + (a.total_questions ?? 0), 0)
  const avgPercent = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0

  return (
    <ProfileClient
      profile={profile}
      stats={{
        totalAttempts: (attempts ?? []).length,
        completedAttempts: completed.length,
        avgPercent,
      }}
    />
  )
}
