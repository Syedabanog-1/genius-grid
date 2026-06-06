'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface RawQuestion {
  contributor?: string
  question?: string
  text?: string
  options?: string[]
  correct_answer?: string | null
  explanation?: string
}

interface ParsedQuestion {
  text: string
  contributor: string
  options: { text: string; label: string; isCorrect: boolean }[]
}

interface ParsedExam {
  title: string
  questions: ParsedQuestion[]
}

function stripOptionPrefix(opt: string): string {
  return opt.replace(/^[A-Za-zΑ-Ωα-ω][.)]\s+|^[A-Za-zΑ-Ωα-ω]\s+/, '').trim()
}

function parseExamJson(json: Record<string, unknown>, filename: string): ParsedExam {
  const rawTitle =
    (json.exam as string) ||
    filename.replace(/\.json$/i, '').replace(/^P\d+-/, '').trim()

  const rawQuestions: RawQuestion[] = Array.isArray(json.questions)
    ? (json.questions as RawQuestion[])
    : []

  const questions: ParsedQuestion[] = rawQuestions
    .map((q) => {
      const text = (q.question || q.text || '').trim()
      if (!text) return null

      const rawOptions: string[] = Array.isArray(q.options) ? q.options : []
      const labels = ['a', 'b', 'c', 'd']
      const correctLetter = q.correct_answer?.toUpperCase()

      const options = rawOptions.slice(0, 4).map((opt, idx) => ({
        text: stripOptionPrefix(opt),
        label: labels[idx] ?? String.fromCharCode(97 + idx),
        isCorrect: correctLetter ? 'ABCD'.indexOf(correctLetter) === idx : false,
      }))

      return {
        text,
        contributor: q.contributor?.trim() || '',
        options,
      } satisfies ParsedQuestion
    })
    .filter(Boolean) as ParsedQuestion[]

  return { title: rawTitle, questions }
}

export default function ImportClient() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [parsed, setParsed] = useState<ParsedExam | null>(null)
  const [filename, setFilename] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryName, setCategoryName] = useState('AI & Agents')
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [timePerQuestion, setTimePerQuestion] = useState(90)
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState(30)
  const [maxRetakes, setMaxRetakes] = useState(0)

  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ quizId: string; count: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setParsed(null)
    setImportResult(null)
    setImportError(null)
    setFilename(file.name)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        const result = parseExamJson(json, file.name)
        if (result.questions.length === 0) {
          setParseError('No valid questions found in this file.')
          return
        }
        setParsed(result)
        setTitle(result.title)
      } catch {
        setParseError('Invalid JSON file. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!parsed) return
    setImporting(true)
    setImportError(null)

    // 1. Ensure category exists
    let categoryId: string | null = null
    const { data: existingCat } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', categoryName.trim())
      .single()

    if (existingCat) {
      categoryId = existingCat.id
    } else {
      const { data: newCat, error: catErr } = await supabase
        .from('categories')
        .insert({ name: categoryName.trim(), icon: '🤖', color: 'bg-blue-100' })
        .select()
        .single()
      if (catErr || !newCat) {
        setImportError(`Failed to create category: ${catErr?.message}`)
        setImporting(false)
        return
      }
      categoryId = newCat.id
    }

    // 2. Create quiz
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        difficulty,
        time_per_question: timePerQuestion,
        questions_per_attempt: questionsPerAttempt,
        max_retakes: maxRetakes,
        is_published: true,
      })
      .select()
      .single()

    if (quizErr || !quiz) {
      setImportError(`Failed to create quiz: ${quizErr?.message}`)
      setImporting(false)
      return
    }

    // 3. Insert questions + options in batches
    let inserted = 0
    for (let i = 0; i < parsed.questions.length; i++) {
      const q = parsed.questions[i]
      const { data: qRow, error: qErr } = await supabase
        .from('questions')
        .insert({
          quiz_id: quiz.id,
          text: q.text,
          contributed_by: q.contributor || null,
          order_index: i,
        })
        .select()
        .single()

      if (qErr || !qRow) continue

      const opts = q.options.map((o) => ({
        question_id: qRow.id,
        text: o.text,
        is_correct: o.isCorrect,
        option_label: o.label,
      }))
      await supabase.from('options').insert(opts)
      inserted++
    }

    setImporting(false)
    setImportResult({ quizId: quiz.id, count: inserted })
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Import Quiz</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload a JSON exam file to create a quiz with all its questions automatically.
        </p>
      </div>

      {/* File picker */}
      {!importResult && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-primary/30 rounded-2xl p-10 text-center cursor-pointer hover:border-primary hover:bg-violet-50/30 transition-all mb-6"
        >
          <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
          {filename ? (
            <>
              <FileJson className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="font-semibold text-slate-700">{filename}</p>
              {parsed && (
                <p className="text-sm text-primary font-medium mt-1">
                  {parsed.questions.length} questions detected — click to change file
                </p>
              )}
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">Click to select a JSON exam file</p>
              <p className="text-sm text-slate-400 mt-1">
                Supports the standard GIAIC exam JSON format
              </p>
            </>
          )}
        </div>
      )}

      {parseError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {parseError}
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-1">Import Complete!</h2>
          <p className="text-slate-500 text-sm mb-4">
            {importResult.count} questions imported successfully.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.push(`/admin/quizzes/${importResult.quizId}`)}
              className="flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primaryHover transition-colors"
            >
              View Quiz <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setParsed(null)
                setFilename('')
                setImportResult(null)
                setTitle('')
                setDescription('')
              }}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 text-slate-600 hover:bg-gray-50 transition-colors"
            >
              Import Another
            </button>
          </div>
        </div>
      )}

      {/* Quiz settings form */}
      {parsed && !importResult && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Quiz Settings</h2>
            <span className="text-xs font-bold text-primary bg-violet-50 px-3 py-1 rounded-full">
              {parsed.questions.length} questions
            </span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Quiz Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none resize-none text-sm"
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                placeholder="e.g. AI & Agents"
              />
              <p className="text-xs text-slate-400 mt-1">Created if it does not exist</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none bg-white text-sm"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Time / Question (s)</label>
              <input
                type="number"
                min={10}
                max={300}
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Questions / Attempt</label>
              <p className="text-xs text-slate-400 mb-1.5">0 = all</p>
              <input
                type="number"
                min={0}
                max={parsed.questions.length}
                value={questionsPerAttempt}
                onChange={(e) => setQuestionsPerAttempt(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Max Retakes</label>
              <p className="text-xs text-slate-400 mb-1.5">0 = unlimited</p>
              <input
                type="number"
                min={0}
                value={maxRetakes}
                onChange={(e) => setMaxRetakes(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          {importError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {importError}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing || !title.trim()}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primaryHover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing {parsed.questions.length} questions...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import Quiz
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
