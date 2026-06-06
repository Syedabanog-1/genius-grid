export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResultsClient from './ResultsClient'

export default async function ResultsPage({
  params,
}: {
  params: { attemptId: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: attempt }, { data: profile }] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select('*, quiz:quizzes(title, category:categories(name))')
      .eq('id', params.attemptId)
      .eq('user_id', user.id)
      .single(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!attempt) redirect('/home')

  return <ResultsClient attempt={attempt} profile={profile} />
}
