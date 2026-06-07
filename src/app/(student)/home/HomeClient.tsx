'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Gem, ChevronRight } from 'lucide-react'
import type { Profile, Category, Quiz, QuizAttempt } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  profile: Profile | null
  categories: Category[]
  quizzes: Quiz[]
  recentAttempts: QuizAttempt[]
}

export default function HomeClient({ profile, categories, quizzes, recentAttempts }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')

  const displayName = profile?.full_name?.split(' ')[0] ?? 'there'
  const avatarSeed = profile?.avatar_seed ?? profile?.email ?? 'default'

  const filteredQuizzes = search
    ? quizzes.filter((q) =>
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.category?.name.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const handleStartQuiz = async (quiz: { id: string; questions_per_attempt: number }) => {
    if (!profile) return

    const { data: allQuestions } = await supabase
      .from('questions')
      .select('id')
      .eq('quiz_id', quiz.id)

    const allIds = (allQuestions ?? []).map((q) => q.id)
    const shuffled = [...allIds]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const count =
      quiz.questions_per_attempt > 0
        ? Math.min(quiz.questions_per_attempt, shuffled.length)
        : shuffled.length
    const selectedIds = shuffled.slice(0, count)

    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .insert({ user_id: profile.id, quiz_id: quiz.id, question_ids: selectedIds })
      .select()
      .single()

    if (!error && attempt) {
      router.push(`/quiz/${quiz.id}?attempt=${attempt.id}`)
    }
  }

  return (
    <div className="min-h-full bg-appbg dark:bg-slate-900 pb-6 relative">
      {/* Decorative background question marks */}
      <div className="absolute top-10 -left-4 text-primary/5 -rotate-12 pointer-events-none">
        <span className="text-8xl font-bold">?</span>
      </div>
      <div className="absolute top-60 right-0 text-primary/5 rotate-12 pointer-events-none">
        <span className="text-6xl font-bold">?</span>
      </div>

      <div className="px-6 pt-8 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-pink-100 p-0.5 border-2 border-white shadow-sm overflow-hidden">
              <Image
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=fce7f3`}
                alt="Avatar"
                width={48}
                height={48}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Hi, {displayName}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ready to play</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-slate-700">
            <Gem className="w-4 h-4 text-pink-400 fill-pink-100" />
            <span className="text-sm font-bold text-primary">{profile?.points ?? 0}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8 shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border-0 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-sm font-medium"
            placeholder="Search for a quiz"
          />
        </div>

        {/* Search Results */}
        {search && (
          <div className="mb-8 space-y-3">
            {filteredQuizzes.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No quizzes found</p>
            ) : (
              filteredQuizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => handleStartQuiz(quiz)}
                  className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-50 dark:border-slate-700 hover:shadow-md transition-shadow active:scale-[0.98]"
                >
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${quiz.category?.color ?? 'bg-pink-100'} text-primary`}>
                      {quiz.category?.name ?? 'General'}
                    </span>
                    <p className="font-bold text-slate-800 text-sm mt-1">{quiz.title}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Banner */}
        {!search && (
          <>
            <div className="relative bg-primary rounded-3xl p-6 mb-8 overflow-hidden shadow-soft">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
              <div className="absolute right-10 -top-10 w-24 h-24 bg-white/5 rounded-full blur-lg" />
              <div className="absolute top-4 right-20 text-white/10 rotate-12 text-4xl font-bold">?</div>
              <div className="absolute bottom-4 left-40 text-white/10 -rotate-12 text-3xl font-bold">?</div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-1">Are You Agent Factory Ready?</h2>
                <p className="text-white/80 text-sm mb-5 font-medium">Test your AI-Native development knowledge</p>
                <button
                  onClick={() => router.push('/quizzes')}
                  className="bg-white text-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center hover:bg-gray-50 transition-colors active:scale-95"
                >
                  Get Started <ChevronRight className="w-4 h-4 ml-1" strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Categories</h3>
                  <button
                    onClick={() => router.push('/quizzes')}
                    className="text-sm font-bold text-primary hover:text-primaryHover"
                  >
                    See all
                  </button>
                </div>
                <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => router.push(`/quizzes?category=${cat.id}`)}
                      className={`${cat.color} min-w-[120px] h-32 rounded-3xl p-4 flex flex-col items-start justify-between relative overflow-hidden transition-transform active:scale-95`}
                    >
                      <span className="font-bold text-primary z-10">{cat.name}</span>
                      <div className="absolute -bottom-2 -right-2 text-6xl opacity-50 grayscale mix-blend-multiply">
                        {cat.icon}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Attempts */}
            {recentAttempts.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Recent</h3>
                <div className="space-y-3">
                  {recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-50 dark:border-slate-700"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-xl ${(attempt as any).quiz?.category?.color ?? 'bg-blue-50'} flex items-center justify-center text-2xl`}
                        >
                          {(attempt as any).quiz?.category?.icon ?? '📚'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{(attempt as any).quiz?.title}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {attempt.total_questions ?? 0} questions
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          attempt.is_completed
                            ? 'bg-green-100 text-green-600'
                            : 'bg-orange-100 text-orange-500'
                        }`}
                      >
                        {attempt.is_completed ? 'Completed' : 'Incomplete'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty recent state */}
            {recentAttempts.length === 0 && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Recent</h3>
                <div className="bg-white p-6 rounded-2xl text-center shadow-sm border border-gray-50">
                  <p className="text-slate-400 text-sm">No quizzes taken yet. Start one now!</p>
                  <button
                    onClick={() => router.push('/quizzes')}
                    className="mt-3 text-primary font-bold text-sm hover:text-primaryHover"
                  >
                    Browse Quizzes
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
