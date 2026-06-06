'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, Gem } from 'lucide-react'

interface User {
  id: string
  full_name: string | null
  avatar_seed: string | null
  points: number
  rank: number
}

interface Props {
  users: User[]
  currentUserId: string
  currentUserRank: User | null
}

function PodiumItem({
  rank,
  name,
  points,
  avatarSeed,
  height,
  color,
  isFirst = false,
}: {
  rank: number
  name: string
  points: number
  avatarSeed: string
  height: string
  color: string
  isFirst?: boolean
}) {
  return (
    <div className="flex flex-col items-center relative">
      {isFirst && <div className="absolute -top-8 text-3xl animate-bounce">👑</div>}
      <div className={`w-16 h-16 rounded-full ${color} p-1 border-4 border-white shadow-md overflow-hidden z-10 relative`}>
        <Image
          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=transparent`}
          alt={name}
          width={56}
          height={56}
          className="w-full h-full object-cover"
          unoptimized
        />
        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-white">
          {rank}
        </div>
      </div>
      <div className={`w-20 ${height} bg-white mt-[-1rem] rounded-t-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-end pb-4`}>
        <span className="font-bold text-slate-800 text-sm">{name.split(' ')[0]}</span>
        <span className="text-xs font-bold text-primary mt-1">{points}</span>
      </div>
    </div>
  )
}

export default function LeaderboardClient({ users, currentUserId, currentUserRank }: Props) {
  const router = useRouter()

  const top3 = users.slice(0, 3)
  const rest = users.slice(3)

  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)
  const podiumColors = ['bg-pink-100', 'bg-yellow-100', 'bg-blue-100']
  const podiumHeights = ['h-32', 'h-40', 'h-28']

  return (
    <div className="min-h-full bg-appbg flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between bg-primary text-white rounded-b-[2.5rem] shadow-soft relative z-10">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <div className="w-10" />
      </div>

      {/* Podium Section */}
      {top3.length >= 1 && (
        <div className="pt-8 pb-12 px-6 flex items-end justify-center space-x-4 relative z-0 mt-[-2rem]">
          {podiumOrder.map((user, i) => {
            if (!user) return null
            const originalIndex = top3.findIndex((u) => u?.id === user.id)
            return (
              <PodiumItem
                key={user.id}
                rank={user.rank}
                name={user.full_name ?? 'Anonymous'}
                points={user.points}
                avatarSeed={user.avatar_seed ?? user.id}
                height={podiumHeights[originalIndex] ?? 'h-32'}
                color={podiumColors[originalIndex] ?? 'bg-pink-100'}
                isFirst={user.rank === 1}
              />
            )
          })}
        </div>
      )}

      {/* List Section */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] px-6 pt-8 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 font-medium">No students yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(rest.length > 0 ? rest : users).map((user) => {
              const isCurrentUser = user.id === currentUserId
              return (
                <div
                  key={user.id}
                  className={`flex items-center p-4 rounded-2xl transition-colors ${
                    isCurrentUser ? 'bg-primary shadow-soft' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-8 text-center font-bold ${isCurrentUser ? 'text-white/80' : 'text-slate-400'}`}>
                    {user.rank}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white p-0.5 shadow-sm overflow-hidden mx-4">
                    <Image
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.avatar_seed ?? user.id)}&backgroundColor=fce7f3`}
                      alt={user.full_name ?? 'User'}
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${isCurrentUser ? 'text-white' : 'text-slate-800'}`}>
                      {user.full_name ?? 'Anonymous'}{isCurrentUser ? ' (You)' : ''}
                    </h3>
                  </div>
                  <div className={`flex items-center space-x-1.5 font-bold ${isCurrentUser ? 'text-white' : 'text-primary'}`}>
                    <Gem className={`w-4 h-4 ${isCurrentUser ? 'text-pink-300 fill-pink-300' : 'text-pink-400 fill-pink-100'}`} />
                    <span>{user.points}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Current user highlight if not in top 20 visible */}
        {currentUserRank && !users.slice(3).find((u) => u.id === currentUserId) && top3.length >= 3 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-slate-400 font-medium mb-3">Your position</p>
            <div className="flex items-center p-4 rounded-2xl bg-primary shadow-soft">
              <div className="w-8 text-center font-bold text-white/80">{currentUserRank.rank}</div>
              <div className="w-12 h-12 rounded-full bg-white p-0.5 shadow-sm overflow-hidden mx-4">
                <Image
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(currentUserRank.avatar_seed ?? currentUserRank.id)}&backgroundColor=fce7f3`}
                  alt="You"
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">{currentUserRank.full_name ?? 'You'} (You)</h3>
              </div>
              <div className="flex items-center space-x-1.5 font-bold text-white">
                <Gem className="w-4 h-4 text-pink-300 fill-pink-300" />
                <span>{currentUserRank.points}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
