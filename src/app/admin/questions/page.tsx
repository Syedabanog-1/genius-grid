export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuestionsClient from './QuestionsClient'

export default async function AdminQuestionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: raw } = await supabase
    .from('questions')
    .select('id, text, contributed_by, order_index, created_at, quiz:quizzes(id, title)')
    .order('created_at', { ascending: false })

  const questions = (raw ?? []).map((q) => ({
    ...q,
    quiz: Array.isArray(q.quiz) ? (q.quiz[0] ?? null) : (q.quiz ?? null),
  }))

  return <QuestionsClient questions={questions} />
}
