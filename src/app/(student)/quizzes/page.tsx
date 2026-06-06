export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuizzesClient from './QuizzesClient'

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: categories }, { data: profile }] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('profiles').select('id').eq('id', user.id).single(),
  ])

  let quizzesQuery = supabase
    .from('quizzes')
    .select('*, category:categories(*), questions(id), questions_per_attempt, max_retakes')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (searchParams.category) {
    quizzesQuery = quizzesQuery.eq('category_id', searchParams.category)
  }

  // Count completed attempts per quiz for the current user
  const [{ data: quizzes }, { data: completedAttempts }] = await Promise.all([
    quizzesQuery,
    supabase
      .from('quiz_attempts')
      .select('quiz_id')
      .eq('user_id', user.id)
      .eq('is_completed', true),
  ])

  // Build a map: quizId → completed attempt count
  const retakeCountMap: Record<string, number> = {}
  for (const a of completedAttempts ?? []) {
    retakeCountMap[a.quiz_id] = (retakeCountMap[a.quiz_id] ?? 0) + 1
  }

  return (
    <QuizzesClient
      categories={categories ?? []}
      quizzes={(quizzes ?? []).map((q) => ({ ...q, questions: q.questions ?? [] }))}
      userId={profile?.id ?? ''}
      initialCategory={searchParams.category ?? null}
      retakeCountMap={retakeCountMap}
    />
  )
}
