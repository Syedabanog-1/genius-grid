export type Role = 'student' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: Role
  points: number
  avatar_seed: string | null
  giaic_id: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  created_at: string
}

export interface Quiz {
  id: string
  title: string
  description: string | null
  category_id: string | null
  difficulty: 'Easy' | 'Medium' | 'Hard'
  time_per_question: number
  questions_per_attempt: number
  max_retakes: number
  is_published: boolean
  created_at: string
  updated_at: string
  category?: Category
  questions?: Question[]
}

export interface Question {
  id: string
  quiz_id: string
  text: string
  order_index: number
  contributed_by: string | null
  created_at: string
  options?: Option[]
}

export interface Option {
  id: string
  question_id: string
  text: string
  is_correct: boolean
  option_label: string
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  score: number | null
  total_questions: number | null
  points_earned: number
  is_completed: boolean
  question_ids: string[] | null
  started_at: string
  completed_at: string | null
  quiz?: Quiz
  profile?: Profile
}

export interface UserAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_option_id: string | null
  is_correct: boolean
}

export interface LeaderboardEntry {
  id: string
  full_name: string | null
  avatar_seed: string | null
  points: number
  rank: number
}
