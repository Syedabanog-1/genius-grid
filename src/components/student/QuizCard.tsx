import { Clock, FileText, RefreshCw, Lock } from 'lucide-react'
import type { Quiz } from '@/lib/types'

interface QuizCardProps {
  quiz: Quiz
  retakeCount?: number
  locked?: boolean
  onStart?: () => void
}

const difficultyStyles = {
  Easy: 'text-green-600 bg-green-50',
  Medium: 'text-orange-600 bg-orange-50',
  Hard: 'text-red-600 bg-red-50',
}

export default function QuizCard({ quiz, retakeCount = 0, locked = false, onStart }: QuizCardProps) {
  const poolSize = quiz.questions?.length ?? 0
  const perAttempt = quiz.questions_per_attempt > 0
    ? Math.min(quiz.questions_per_attempt, poolSize)
    : poolSize
  const totalTime = Math.ceil((perAttempt * quiz.time_per_question) / 60)
  const diff = quiz.difficulty as 'Easy' | 'Medium' | 'Hard'
  const catColor = quiz.category?.color ?? 'bg-pink-100'
  const hasRetakeLimit = quiz.max_retakes > 0

  return (
    <div
      onClick={locked ? undefined : onStart}
      className={`bg-white p-5 rounded-3xl shadow-sm border transition-shadow relative overflow-hidden ${
        locked
          ? 'border-gray-100 opacity-60 cursor-not-allowed'
          : 'border-gray-50 cursor-pointer hover:shadow-md active:scale-[0.98]'
      }`}
    >
      {/* Locked overlay label */}
      {locked && (
        <div className="absolute top-3 right-3 flex items-center space-x-1 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-xs font-bold">
          <Lock className="w-3 h-3" />
          <span>Max retakes reached</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="pr-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${catColor} text-primary mb-2 inline-block`}>
            {quiz.category?.name ?? 'General'}
          </span>
          <h3 className="font-bold text-slate-800 text-lg leading-tight">{quiz.title}</h3>
        </div>
        {!locked && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${difficultyStyles[diff]}`}>
            {quiz.difficulty}
          </span>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 font-medium">
        <div className="flex items-center">
          <FileText className="w-4 h-4 mr-1.5 flex-shrink-0" />
          {perAttempt} Qs
          {quiz.questions_per_attempt > 0 && poolSize > perAttempt && (
            <span className="ml-1 text-slate-400">of {poolSize}</span>
          )}
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1.5 flex-shrink-0" />
          {totalTime} min
        </div>
        {hasRetakeLimit && (
          <div className={`flex items-center ${locked ? 'text-red-400' : retakeCount > 0 ? 'text-orange-500' : 'text-slate-400'}`}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span className="font-bold">{retakeCount}/{quiz.max_retakes}</span>
            <span className="ml-1 font-normal">retakes</span>
          </div>
        )}
      </div>
    </div>
  )
}
