'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { HelpCircle, User, ChevronRight } from 'lucide-react'

interface Question {
  id: string
  text: string
  contributed_by: string | null
  order_index: number
  created_at: string
  quiz: { id: string; title: string } | null
}

interface Props {
  questions: Question[]
}

export default function QuestionsClient({ questions }: Props) {
  const [filterContributor, setFilterContributor] = useState<string>('')
  const [search, setSearch] = useState('')

  const contributors = useMemo(() => {
    const set = new Set<string>()
    questions.forEach((q) => {
      if (q.contributed_by) set.add(q.contributed_by)
    })
    return Array.from(set).sort()
  }, [questions])

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const matchesContributor = !filterContributor || q.contributed_by === filterContributor
      const matchesSearch =
        !search ||
        q.text.toLowerCase().includes(search.toLowerCase()) ||
        (q.quiz?.title ?? '').toLowerCase().includes(search.toLowerCase())
      return matchesContributor && matchesSearch
    })
  }, [questions, filterContributor, search])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Questions</h1>
        <p className="text-slate-500 text-sm mt-1">
          {filtered.length} of {questions.length} questions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions or quiz name..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <select
          value={filterContributor}
          onChange={(e) => setFilterContributor(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white min-w-[200px]"
        >
          <option value="">All Contributors</option>
          {contributors.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Contributor chips */}
      {contributors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterContributor('')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              !filterContributor ? 'bg-primary text-white' : 'bg-white text-slate-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {contributors.map((c) => {
            const count = questions.filter((q) => q.contributed_by === c).length
            return (
              <button
                key={c}
                onClick={() => setFilterContributor(filterContributor === c ? '' : c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  filterContributor === c
                    ? 'bg-primary text-white'
                    : 'bg-white text-slate-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <User className="w-3 h-3" />
                {c}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterContributor === c ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Questions list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No questions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((q) => (
              <div key={q.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 font-medium leading-relaxed line-clamp-2">
                      {q.text}
                    </p>
                    <div className="flex items-center flex-wrap gap-3 mt-2">
                      {q.quiz && (
                        <Link
                          href={`/admin/quizzes/${q.quiz.id}`}
                          className="flex items-center gap-1 text-xs text-primary font-semibold hover:text-primaryHover"
                        >
                          {q.quiz.title}
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                      {q.contributed_by && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <User className="w-3 h-3" />
                          {q.contributed_by}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
