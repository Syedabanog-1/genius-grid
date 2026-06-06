export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeaderboardClient from './LeaderboardClient'

export default async function LeaderboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: topUsers } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_seed, points')
    .eq('role', 'student')
    .order('points', { ascending: false })
    .limit(20)

  const users = (topUsers ?? []).map((u, idx) => ({ ...u, rank: idx + 1 }))
  const currentUserRank = users.find((u) => u.id === user.id)

  return <LeaderboardClient users={users} currentUserId={user.id} currentUserRank={currentUserRank ?? null} />
}
