export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuizEditorClient from '../[id]/QuizEditorClient'

export default async function NewQuizPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: categories } = await supabase.from('categories').select('*').order('name')

  return <QuizEditorClient quiz={null} categories={categories ?? []} isNew />
}
