export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: categories }, { data: quizzes }, { data: recentAttempts }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('categories').select('*').limit(6),
      supabase
        .from('quizzes')
        .select('*, category:categories(*), questions(id)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('quiz_attempts')
        .select('*, quiz:quizzes(title, category:categories(icon, color))')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(5),
    ])

  return (
    <HomeClient
      profile={profile}
      categories={categories ?? []}
      quizzes={(quizzes ?? []).map((q) => ({
        ...q,
        questions: q.questions ?? [],
      }))}
      recentAttempts={recentAttempts ?? []}
    />
  )
}
