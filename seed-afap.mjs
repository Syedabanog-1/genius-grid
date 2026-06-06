/**
 * Seed: Agent Foundations And Prompting - Practice
 * Reads the JSON from Quiz_Content/ and pushes to Supabase.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Get it from: Supabase Dashboard → Settings → API → service_role
 *
 * Run: node seed-afap.mjs
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------- load .env.local ----------
const envRaw = readFileSync(join(__dirname, '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envRaw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('\n❌  Missing credentials.\n')
  console.error('Add this line to D:\\Products\\Quiz-App\\app\\.env.local:')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>')
  console.error('\nGet it from: Supabase Dashboard → Project Settings → API → service_role\n')
  process.exit(1)
}

// ---------- Supabase REST helpers ----------
async function sb(method, table, body, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params}`
  const res = await fetch(url, {
    method,
    headers: {
      apikey:          SERVICE_KEY,
      Authorization:   `Bearer ${SERVICE_KEY}`,
      'Content-Type':  'application/json',
      Prefer:          'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${table}: ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}

// ---------- option text parser ----------
function stripPrefix(opt) {
  // Handles "A. text", "A) text", "A text", Greek-alpha variants
  return String(opt)
    .replace(/^[A-Za-zΑ-Ωα-ω][.)]\s+/, '')
    .replace(/^[A-Za-zΑ-Ωα-ω]\s+/, '')
    .trim()
}

// ---------- main ----------
async function main() {
  const jsonPath = join(__dirname, '..', 'Quiz_Content', 'Agent Foundations And Prompting - Practice.json')
  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'))

  console.log(`\n📚  ${data.exam}`)
  console.log(`📝  ${data.questions.length} questions in pool`)
  console.log(`⏱️   120 s / question  (30 × 120 s = 60 min)\n`)

  // 1 — category
  const [cat] = await sb('POST', 'categories', {
    name:  'AI & Agents',
    icon:  '🤖',
    color: 'bg-blue-100',
  })
  console.log(`✅  Category: ${cat.id}`)

  // 2 — quiz
  const [quiz] = await sb('POST', 'quizzes', {
    title:                  'Agent Foundations And Prompting - Practice',
    description:            `Practice exam covering Agent Factory fundamentals, the 7 invariants, AI-Native development, and GIAIC curriculum pathways. Each attempt draws 30 random questions from a pool of ${data.questions.length}.`,
    category_id:            cat.id,
    difficulty:             'Hard',
    time_per_question:      120,   // 30 × 120 s = 60 min
    questions_per_attempt:  30,
    max_retakes:            0,     // 0 = unlimited
    is_published:           true,
  })
  console.log(`✅  Quiz: ${quiz.id}\n`)

  // 3 — questions + options
  const LABELS = ['a', 'b', 'c', 'd']
  let ok = 0
  let skip = 0

  for (let i = 0; i < data.questions.length; i++) {
    const q    = data.questions[i]
    const text = (q.question || q.text || '').trim()
    if (!text) { skip++; continue }

    let qRow
    try {
      ;[qRow] = await sb('POST', 'questions', {
        quiz_id:        quiz.id,
        text,
        contributed_by: q.contributor?.trim() || null,
        order_index:    i,
      })
    } catch (e) {
      console.warn(`  ⚠️  Q${i + 1} insert failed: ${e.message}`)
      skip++
      continue
    }

    const correctLetter = (q.correct_answer ?? '').toString().toUpperCase()
    const options = (q.options || []).slice(0, 4).map((opt, idx) => ({
      question_id:  qRow.id,
      text:         stripPrefix(opt),
      is_correct:   correctLetter ? 'ABCD'.indexOf(correctLetter) === idx : false,
      option_label: LABELS[idx] ?? String.fromCharCode(97 + idx),
    }))

    try {
      await sb('POST', 'options', options)
    } catch (e) {
      console.warn(`  ⚠️  Q${i + 1} options failed: ${e.message}`)
    }

    ok++
    process.stdout.write(`\r   ${ok + skip}/${data.questions.length} processed…`)
  }

  console.log(`\n\n✅  Done — ${ok} questions inserted, ${skip} skipped.`)
  console.log(`\n🔗  Quiz ID : ${quiz.id}`)
  console.log(`🏷️   Category: ${cat.id}\n`)
}

main().catch(err => {
  console.error('\n❌', err.message)
  process.exit(1)
})
