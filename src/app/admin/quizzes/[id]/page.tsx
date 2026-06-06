export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuizEditorClient from './QuizEditorClient'

export default async function QuizEditorPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [{ data: quiz }, { data: categories }] = await Promise.all([
    supabase
      .from('quizzes')
      .select('*, questions(*, options(*))')
      .eq('id', params.id)
      .single(),
    supabase.from('categories').select('*').order('name'),
  ])

  if (!quiz) redirect('/admin/quizzes')

  const sortedQuiz = {
    ...quiz,
    questions: (quiz.questions ?? [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((q: any) => ({
        ...q,
        options: (q.options ?? []).sort((a: any, b: any) =>
          a.option_label.localeCompare(b.option_label)
        ),
      })),
  }

  return <QuizEditorClient quiz={sortedQuiz} categories={categories ?? []} isNew={false} />
}
