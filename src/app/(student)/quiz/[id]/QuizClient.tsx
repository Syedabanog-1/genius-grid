'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, User } from 'lucide-react'
import type { Quiz, Question } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  quiz: Quiz
  questions: Question[]
  attemptId: string
  userId: string
}

export default function QuizClient({ quiz, questions, attemptId, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const totalQuestions = questions.length

  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(quiz.time_per_question)
  const [submitting, setSubmitting] = useState(false)

  const currentQuestion = questions[currentQIndex]

  const handleNext = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)

    const selectedOpt = selectedOption
      ? currentQuestion?.options?.find((o) => o.id === selectedOption)
      : null

    if (currentQuestion) {
      await supabase.from('user_answers').insert({
        attempt_id: attemptId,
        question_id: currentQuestion.id,
        selected_option_id: selectedOpt?.id ?? null,
        is_correct: selectedOpt?.is_correct ?? false,
      })
    }

    if (currentQIndex === totalQuestions - 1) {
      const { data: allAnswers } = await supabase
        .from('user_answers')
        .select('is_correct')
        .eq('attempt_id', attemptId)

      const totalCorrect = (allAnswers ?? []).filter((a) => a.is_correct).length
      const pointsEarned = totalCorrect * 10

      await supabase
        .from('quiz_attempts')
        .update({
          score: totalCorrect,
          total_questions: totalQuestions,
          points_earned: pointsEarned,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single()

      if (profileData) {
        await supabase
          .from('profiles')
          .update({ points: (profileData.points ?? 0) + pointsEarned, updated_at: new Date().toISOString() })
          .eq('id', userId)
      }

      router.push(`/results/${attemptId}`)
    } else {
      setCurrentQIndex((prev) => prev + 1)
      setSelectedOption(null)
      setTimeLeft(quiz.time_per_question)
      setSubmitting(false)
    }
  }, [
    submitting,
    selectedOption,
    currentQuestion,
    currentQIndex,
    totalQuestions,
    attemptId,
    userId,
    quiz.time_per_question,
    supabase,
    router,
  ])

  useEffect(() => {
    if (timeLeft <= 0) {
      handleNext()
      return
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, currentQIndex, handleNext])

  const progressPercent = ((currentQIndex + 1) / totalQuestions) * 100
  const timerPercent = (timeLeft / quiz.time_per_question) * 100
  const timerColor =
    timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-orange-400' : 'text-primary'

  return (
    <div className="min-h-full bg-white flex flex-col relative">
      {/* Decorative */}
      <div className="absolute top-40 left-4 text-pink-100/50 -rotate-12 pointer-events-none">
        <span className="text-6xl font-bold">?</span>
      </div>
      <div className="absolute top-20 right-10 text-pink-100/50 rotate-12 pointer-events-none">
        <span className="text-4xl font-bold">?</span>
      </div>

      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-800" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 ml-2">
          {quiz.category?.name ?? quiz.title}
        </h1>
      </div>

      <div className="px-6 flex-1 flex flex-col">
        {/* Progress & Timer */}
        <div className="flex items-center justify-between mb-8 mt-2">
          <div className="flex-1 mr-8">
            <div className="text-sm font-bold text-slate-500 mb-2">Question</div>
            <div className="flex items-baseline space-x-1 mb-3">
              <span className="text-3xl font-extrabold text-pink-500">{currentQIndex + 1}</span>
              <span className="text-xl font-bold text-slate-800">/{totalQuestions}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: `${(currentQIndex / totalQuestions) * 100}%` }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Circular Timer */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-100"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${timerColor} transition-all duration-1000 ease-linear`}
                strokeWidth="3"
                strokeDasharray={`${timerPercent}, 100`}
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className={`absolute text-sm font-bold ${timerColor}`}>
              00:{timeLeft.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`q-${currentQIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-pink-100 rounded-3xl p-6 mb-4 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 text-pink-200 rotate-12 text-3xl font-bold">?</div>
            <div className="absolute bottom-4 left-4 text-pink-200 -rotate-12 text-2xl font-bold">?</div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 border-4 border-pink-200 rounded-full opacity-50" />
            <div className="absolute -top-6 -left-6 w-20 h-20 border-4 border-pink-200 rounded-lg rotate-45 opacity-50" />
            <h2 className="text-lg font-bold text-slate-800 leading-relaxed relative z-10">
              {currentQuestion?.text ?? ''}
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Contributed by */}
        {currentQuestion?.contributed_by && (
          <div className="flex items-center space-x-1.5 mb-5 px-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-400 font-medium">
              Contributed by <span className="font-semibold text-slate-500">{currentQuestion.contributed_by}</span>
            </p>
          </div>
        )}

        {!currentQuestion?.contributed_by && <div className="mb-4" />}

        {/* Options */}
        <div className="space-y-3 mb-8">
          {(currentQuestion?.options ?? [])
            .sort((a, b) => a.option_label.localeCompare(b.option_label))
            .map((opt) => {
              const isSelected = selectedOption === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-violet-50 shadow-sm'
                      : 'border-transparent bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 transition-colors ${
                      isSelected ? 'bg-primary text-white' : 'bg-white text-slate-500 shadow-sm'
                    }`}
                  >
                    {opt.option_label}
                  </div>
                  <span
                    className={`font-semibold text-left ${
                      isSelected ? 'text-primary' : 'text-slate-700'
                    }`}
                  >
                    {opt.text}
                  </span>
                </button>
              )
            })}
        </div>

        {/* Next Button */}
        <div className="mt-auto pb-8">
          <button
            onClick={handleNext}
            disabled={!selectedOption || submitting}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              selectedOption && !submitting
                ? 'bg-primary text-white shadow-soft hover:bg-primaryHover active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting
              ? 'Saving...'
              : currentQIndex === totalQuestions - 1
              ? 'Finish'
              : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
