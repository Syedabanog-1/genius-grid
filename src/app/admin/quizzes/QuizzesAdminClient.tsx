'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Clock, FileText, Eye, EyeOff } from 'lucide-react'
import type { Category, Quiz } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialQuizzes: Quiz[]
  categories: Category[]
}

const difficultyStyles = {
  Easy: 'text-green-600 bg-green-50',
  Medium: 'text-orange-600 bg-orange-50',
  Hard: 'text-red-600 bg-red-50',
}

export default function QuizzesAdminClient({ initialQuizzes, categories }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [quizzes, setQuizzes] = useState(initialQuizzes)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = filterCategory
    ? quizzes.filter((q) => q.category_id === filterCategory)
    : quizzes

  const handleTogglePublish = async (quiz: Quiz) => {
    const { data, error } = await supabase
      .from('quizzes')
      .update({ is_published: !quiz.is_published })
      .eq('id', quiz.id)
      .select()
      .single()

    if (!error && data) {
      setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? { ...q, is_published: data.is_published } : q)))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quiz? This will also delete all its questions and student attempts.')) return
    setDeleteId(id)
    const { error } = await supabase.from('quizzes').delete().eq('id', id)
    if (!error) {
      setQuizzes((prev) => prev.filter((q) => q.id !== id))
    }
    setDeleteId(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quizzes</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all quizzes on the platform</p>
        </div>
        <Link
          href="/admin/quizzes/new"
          className="flex items-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primaryHover transition-colors shadow-soft"
        >
          <Plus className="w-4 h-4" />
          <span>New Quiz</span>
        </Link>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-3 overflow-x-auto no-scrollbar mb-6 pb-1">
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
            !filterCategory ? 'bg-primary text-white' : 'bg-white text-slate-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id === filterCategory ? null : cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              filterCategory === cat.id ? 'bg-primary text-white' : 'bg-white text-slate-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Quiz Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 font-medium">No quizzes found.</p>
            <Link href="/admin/quizzes/new" className="mt-3 inline-block text-primary font-bold text-sm hover:text-primaryHover">
              Create your first quiz
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quiz</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Questions</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time/Q</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((quiz) => {
                  const diff = quiz.difficulty as 'Easy' | 'Medium' | 'Hard'
                  return (
                    <tr key={quiz.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 text-sm">{quiz.title}</p>
                        {quiz.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{quiz.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${(quiz.category as any)?.color ?? 'bg-pink-100'} text-primary`}>
                          {(quiz.category as any)?.name ?? 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${difficultyStyles[diff]}`}>
                          {quiz.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-slate-500">
                          <FileText className="w-4 h-4 mr-1.5" />
                          {(quiz.questions as any)?.length ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-slate-500">
                          <Clock className="w-4 h-4 mr-1.5" />
                          {quiz.time_per_question}s
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${quiz.is_published ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'}`}>
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleTogglePublish(quiz)}
                            title={quiz.is_published ? 'Unpublish' : 'Publish'}
                            className="p-2 rounded-lg hover:bg-gray-100 text-slate-500 hover:text-slate-700 transition-colors"
                          >
                            {quiz.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <Link
                            href={`/admin/quizzes/${quiz.id}`}
                            className="p-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(quiz.id)}
                            disabled={deleteId === quiz.id}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
