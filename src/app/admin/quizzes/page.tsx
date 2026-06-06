export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuizzesAdminClient from './QuizzesAdminClient'

export default async function AdminQuizzesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [{ data: quizzes }, { data: categories }] = await Promise.all([
    supabase
      .from('quizzes')
      .select('*, category:categories(name, color), questions(id)')
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('name'),
  ])

  return (
    <QuizzesAdminClient
      initialQuizzes={(quizzes ?? []).map((q) => ({ ...q, questions: q.questions ?? [] }))}
      categories={categories ?? []}
    />
  )
}
