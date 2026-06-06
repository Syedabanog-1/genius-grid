'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Trash2, Save, CheckCircle } from 'lucide-react'
import type { Category, Quiz, Question, Option } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface LocalOption {
  id?: string
  text: string
  is_correct: boolean
  option_label: string
}

interface LocalQuestion {
  id?: string
  text: string
  contributed_by: string
  order_index: number
  options: LocalOption[]
}

interface Props {
  quiz: Quiz | null
  categories: Category[]
  isNew: boolean
}

const defaultOptions = (): LocalOption[] => [
  { text: '', is_correct: true, option_label: 'a' },
  { text: '', is_correct: false, option_label: 'b' },
  { text: '', is_correct: false, option_label: 'c' },
  { text: '', is_correct: false, option_label: 'd' },
]

const defaultQuestion = (order: number): LocalQuestion => ({
  text: '',
  contributed_by: '',
  order_index: order,
  options: defaultOptions(),
})

export default function QuizEditorClient({ quiz, categories, isNew }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(quiz?.title ?? '')
  const [description, setDescription] = useState(quiz?.description ?? '')
  const [categoryId, setCategoryId] = useState(quiz?.category_id ?? '')
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(quiz?.difficulty ?? 'Medium')
  const [timePerQuestion, setTimePerQuestion] = useState(quiz?.time_per_question ?? 30)
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState(quiz?.questions_per_attempt ?? 0)
  const [maxRetakes, setMaxRetakes] = useState(quiz?.max_retakes ?? 0)
  const [isPublished, setIsPublished] = useState(quiz?.is_published ?? false)
  const [questions, setQuestions] = useState<LocalQuestion[]>(
    (quiz?.questions ?? []).map((q: any) => ({
      id: q.id,
      text: q.text,
      contributed_by: q.contributed_by ?? '',
      order_index: q.order_index,
      options: (q.options ?? []).map((o: any) => ({
        id: o.id,
        text: o.text,
        is_correct: o.is_correct,
        option_label: o.option_label,
      })),
    }))
  )

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addQuestion = () => {
    setQuestions((prev) => [...prev, defaultQuestion(prev.length)])
  }

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, text: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, text } : q)))
  }

  const updateContributedBy = (index: number, contributed_by: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, contributed_by } : q)))
  }

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === oIndex ? { ...o, text } : o)) }
          : q
      )
    )
  }

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, j) => ({ ...o, is_correct: j === oIndex })),
            }
          : q
      )
    )
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Quiz title is required.')
      return
    }
    setSaving(true)
    setError(null)

    let quizId = quiz?.id

    if (isNew) {
      const { data, error: createError } = await supabase
        .from('quizzes')
        .insert({
          title,
          description: description || null,
          category_id: categoryId || null,
          difficulty,
          time_per_question: timePerQuestion,
          questions_per_attempt: questionsPerAttempt,
          max_retakes: maxRetakes,
          is_published: isPublished,
        })
        .select()
        .single()

      if (createError || !data) {
        setError(createError?.message ?? 'Failed to create quiz.')
        setSaving(false)
        return
      }
      quizId = data.id
    } else {
      const { error: updateError } = await supabase
        .from('quizzes')
        .update({
          title,
          description: description || null,
          category_id: categoryId || null,
          difficulty,
          time_per_question: timePerQuestion,
          questions_per_attempt: questionsPerAttempt,
          max_retakes: maxRetakes,
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quizId!)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
    }

    // Save questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      let questionId = q.id

      if (!q.id) {
        // New question
        const { data: qData, error: qErr } = await supabase
          .from('questions')
          .insert({
            quiz_id: quizId!,
            text: q.text,
            contributed_by: q.contributed_by.trim() || null,
            order_index: i,
          })
          .select()
          .single()

        if (qErr || !qData) continue
        questionId = qData.id

        // Insert options
        const opts = q.options.map((o) => ({
          question_id: questionId!,
          text: o.text,
          is_correct: o.is_correct,
          option_label: o.option_label,
        }))
        await supabase.from('options').insert(opts)
      } else {
        // Update existing question
        await supabase
          .from('questions')
          .update({ text: q.text, contributed_by: q.contributed_by.trim() || null, order_index: i })
          .eq('id', q.id)

        // Update options
        for (const opt of q.options) {
          if (opt.id) {
            await supabase
              .from('options')
              .update({ text: opt.text, is_correct: opt.is_correct })
              .eq('id', opt.id)
          }
        }
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

    if (isNew) {
      router.push(`/admin/quizzes/${quizId}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/admin/quizzes')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isNew ? 'Create Quiz' : 'Edit Quiz'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isNew ? 'Set up a new quiz' : `Editing: ${quiz?.title}`}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primaryHover transition-colors shadow-soft disabled:opacity-60"
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Quiz'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl border border-red-100 mb-6">
          {error}
        </div>
      )}

      {/* Quiz Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-5">Quiz Details</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="e.g. Algebra Basics"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Time per question (seconds)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
              <button
                type="button"
                onClick={() => setIsPublished((p) => !p)}
                className={`w-full px-4 py-3 rounded-xl font-semibold text-sm border-2 transition-colors ${
                  isPublished
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-orange-50 border-orange-200 text-orange-600'
                }`}
              >
                {isPublished ? '✓ Published' : '○ Draft'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Questions per attempt
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Shuffled from full pool. 0 = use all.
              </p>
              <input
                type="number"
                min={0}
                value={questionsPerAttempt}
                onChange={(e) => setQuestionsPerAttempt(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="0 = all"
              />
              {questionsPerAttempt > 0 && questions.length > 0 && (
                <p className="text-xs text-primary mt-1.5 font-medium">
                  {Math.min(questionsPerAttempt, questions.length)} of {questions.length} shown
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Max retakes
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Per student. 0 = unlimited.
              </p>
              <input
                type="number"
                min={0}
                value={maxRetakes}
                onChange={(e) => setMaxRetakes(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="0 = unlimited"
              />
              {maxRetakes > 0 && (
                <p className="text-xs text-orange-500 mt-1.5 font-medium">
                  Students can retake {maxRetakes}×
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            Questions ({questions.length})
          </h2>
        </div>

        {questions.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-slate-400 font-medium">No questions yet.</p>
            <p className="text-slate-300 text-sm mt-1">Add your first question below.</p>
          </div>
        )}

        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm font-bold text-primary bg-violet-50 px-3 py-1 rounded-full">
                Q{qIdx + 1}
              </span>
              <button
                onClick={() => removeQuestion(qIdx)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Question Text</label>
              <textarea
                value={q.text}
                onChange={(e) => updateQuestion(qIdx, e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                placeholder="Enter question..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Contributed by <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={q.contributed_by}
                onChange={(e) => updateContributedBy(qIdx, e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Name of person who suggested this question"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Options (select correct answer)
              </label>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center space-x-3">
                  <button
                    onClick={() => setCorrectOption(qIdx, oIdx)}
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold border-2 transition-all ${
                      opt.is_correct
                        ? 'bg-primary border-primary text-white'
                        : 'border-gray-200 text-slate-400 hover:border-primary/50'
                    }`}
                  >
                    {opt.option_label}
                  </button>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                    className={`flex-1 px-4 py-2.5 border rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-colors ${
                      opt.is_correct ? 'border-primary bg-violet-50' : 'border-gray-200'
                    }`}
                    placeholder={`Option ${opt.option_label.toUpperCase()}`}
                  />
                  {opt.is_correct && (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg whitespace-nowrap">
                      Correct
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Question Button */}
      <button
        onClick={addQuestion}
        className="w-full py-4 border-2 border-dashed border-primary/30 rounded-2xl text-primary font-bold text-sm hover:border-primary hover:bg-violet-50 transition-all flex items-center justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>Add Question</span>
      </button>
    </div>
  )
}
