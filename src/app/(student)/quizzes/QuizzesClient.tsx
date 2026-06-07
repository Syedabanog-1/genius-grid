'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import type { Category, Quiz } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import QuizCard from '@/components/student/QuizCard'

interface Props {
  categories: Category[]
  quizzes: Quiz[]
  userId: string
  initialCategory: string | null
  retakeCountMap: Record<string, number>
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuizzesClient({ categories, quizzes, userId, initialCategory, retakeCountMap }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory)
  const [loading, setLoading] = useState<string | null>(null)

  const filteredQuizzes = selectedCategory
    ? quizzes.filter((q) => q.category_id === selectedCategory)
    : quizzes

  const isRetakeLocked = (quiz: Quiz) => {
    if (quiz.max_retakes === 0) return false
    const used = retakeCountMap[quiz.id] ?? 0
    return used >= quiz.max_retakes
  }

  const handleStartQuiz = async (quiz: Quiz) => {
    if (!userId || loading || isRetakeLocked(quiz)) return
    setLoading(quiz.id)

    const { data: allQuestions } = await supabase
      .from('questions')
      .select('id')
      .eq('quiz_id', quiz.id)

    const allIds = (allQuestions ?? []).map((q) => q.id)
    const shuffled = shuffleArray(allIds)
    const count =
      quiz.questions_per_attempt > 0
        ? Math.min(quiz.questions_per_attempt, shuffled.length)
        : shuffled.length
    const selectedIds = shuffled.slice(0, count)

    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .insert({ user_id: userId, quiz_id: quiz.id, question_ids: selectedIds })
      .select()
      .single()

    if (!error && attempt) {
      router.push(`/quiz/${quiz.id}?attempt=${attempt.id}`)
    } else {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-appbg pb-6">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center bg-white sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-800" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 ml-2">Select Quiz</h1>
      </div>

      <div className="px-6 pt-6">
        {/* Filters */}
        <div className="flex space-x-3 overflow-x-auto no-scrollbar mb-6 pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-slate-500 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-slate-500 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Quiz List */}
        <div className="space-y-4">
          {filteredQuizzes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 font-medium">No quizzes available yet.</p>
              <p className="text-slate-300 text-sm mt-1">Check back soon!</p>
            </div>
          ) : (
            filteredQuizzes.map((quiz) => {
              const retakeCount = retakeCountMap[quiz.id] ?? 0
              const locked = isRetakeLocked(quiz)
              return (
                <div key={quiz.id} className={loading === quiz.id ? 'opacity-70 pointer-events-none' : ''}>
                  <QuizCard
                    quiz={quiz}
                    retakeCount={retakeCount}
                    locked={locked}
                    onStart={() => handleStartQuiz(quiz)}
                  />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
