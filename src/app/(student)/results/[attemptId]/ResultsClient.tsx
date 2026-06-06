'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Gem } from 'lucide-react'
import Image from 'next/image'
import type { QuizAttempt, Profile } from '@/lib/types'

interface Props {
  attempt: QuizAttempt
  profile: Profile | null
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export default function ResultsClient({ attempt, profile }: Props) {
  const router = useRouter()
  const score = attempt.score ?? 0
  const total = attempt.total_questions ?? 0
  const pointsEarned = attempt.points_earned ?? 0
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  const displayName = profile?.full_name?.split(' ')[0] ?? 'there'
  const avatarSeed = profile?.avatar_seed ?? profile?.email ?? 'default'

  const getMessage = () => {
    if (percentage >= 90) return 'Outstanding performance!'
    if (percentage >= 70) return "Great job! You've done well"
    if (percentage >= 50) return 'Good effort! Keep practicing'
    return 'Keep trying, you can do better!'
  }

  const getTitle = () => {
    if (percentage >= 90) return 'Excellent!'
    if (percentage >= 70) return 'Congratulations!'
    if (percentage >= 50) return 'Well Done!'
    return 'Good Try!'
  }

  return (
    <div className="min-h-full bg-white flex flex-col relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <StarIcon className="absolute top-24 left-12 w-6 h-6 text-pink-300" />
        <StarIcon className="absolute top-16 right-20 w-4 h-4 text-pink-200" />
        <StarIcon className="absolute top-40 right-10 w-8 h-8 text-pink-300" />
        <StarIcon className="absolute top-64 left-8 w-5 h-5 text-pink-200" />
        <StarIcon className="absolute top-72 right-16 w-6 h-6 text-pink-300" />

        <div className="absolute top-32 left-8 text-pink-400 rotate-45 text-2xl">🎉</div>
        <div className="absolute top-28 right-12 text-pink-400 -rotate-12 text-2xl">🎊</div>
        <div className="absolute top-60 left-16 text-pink-400 -rotate-45 text-2xl">🎊</div>
        <div className="absolute top-64 right-8 text-pink-400 rotate-12 text-2xl">🎉</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-10 pb-8 z-10">
        {/* Score Ring Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
          className="relative w-48 h-48 mb-10 flex items-center justify-center"
        >
          <div className="absolute inset-0 border-[3px] border-dashed border-pink-300 rounded-full animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-2 bg-pink-100 rounded-full" />
          <div className="absolute inset-4 bg-pink-200/50 rounded-full" />
          <div className="absolute inset-6 bg-white rounded-full overflow-hidden border-4 border-white shadow-md">
            <Image
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=fce7f3`}
              alt="Avatar"
              width={144}
              height={144}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        </motion.div>

        {/* Score Text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <p className="text-sm font-bold text-slate-500 mb-1">Your Score</p>
          <h2 className="text-4xl font-extrabold text-primary mb-6">
            {score}
            <span className="text-2xl text-slate-400">/{total}</span>
          </h2>
          <h1 className="text-3xl font-bold text-primary mb-3">{getTitle()}</h1>
          <p className="text-slate-500 font-medium">
            {getMessage()}, {displayName}!
          </p>
        </motion.div>

        {/* Points Earned */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-center space-x-2 bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100 shadow-sm mb-auto"
        >
          <Gem className="w-5 h-5 text-pink-400 fill-pink-100" />
          <span className="font-bold text-primary">+{pointsEarned} Points Earned</span>
        </motion.div>

        {/* Percentage badge */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 mb-4"
        >
          <div
            className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-sm ${
              percentage >= 70
                ? 'bg-green-100 text-green-600'
                : percentage >= 50
                ? 'bg-orange-100 text-orange-600'
                : 'bg-red-100 text-red-600'
            }`}
          >
            {percentage}% Correct
          </div>
        </motion.div>

        {/* Footer Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full mt-8 space-y-3"
        >
          <button
            onClick={() => router.push('/quizzes')}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-soft hover:bg-primaryHover active:scale-[0.98] transition-all"
          >
            Try Another Quiz
          </button>
          <button
            onClick={() => router.push('/home')}
            className="w-full bg-gray-100 text-slate-700 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  )
}
