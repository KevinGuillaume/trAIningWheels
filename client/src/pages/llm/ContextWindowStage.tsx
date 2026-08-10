import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { TokenizeStatus } from '../../lib/useTokenizer'
import type { WorkerToken } from '../../workers/tokenizerWorker'

interface ContextWindowStageProps {
  tokenize: (text: string) => Promise<WorkerToken[]>
  status: TokenizeStatus
  progress: number
  error: string | null
}

const SYSTEM_PROMPT =
  'You are a helpful assistant. Answer questions clearly and concisely, and ask for clarification if a request is ambiguous.'

// A growing conversation, oldest first. The window fills up as more of
// these get included, and the oldest ones are the first to get dropped.
const HISTORY_POOL = [
  'What year did the Winter Olympics take place?',
  "The 2026 Winter Olympics were held in Milan and Cortina d'Ampezzo, Italy.",
  'Who won the Super Bowl that year?',
  'Super Bowl LX was played in February 2026.',
  'What about the World Cup?',
  'The 2026 World Cup was hosted jointly by the US, Mexico, and Canada.',
]

// Real models have windows in the thousands to hundreds of thousands of
// tokens. These are shrunk way down so a few sentences can actually fill
// and overflow one, without you having to type a novel.
const WINDOW_OPTIONS = [
  { label: 'Tiny: 60 tokens', value: 60 },
  { label: 'Small: 150 tokens', value: 150 },
  { label: 'Medium: 400 tokens', value: 400 },
]

const DEFAULT_USER_INPUT = "Can you summarize what we've covered so far?"

export default function ContextWindowStage({ tokenize, status, progress, error }: ContextWindowStageProps) {
  const [windowSize, setWindowSize] = useState(WINDOW_OPTIONS[1].value)
  const [historyCount, setHistoryCount] = useState(2)
  const [userInputText, setUserInputText] = useState(DEFAULT_USER_INPUT)

  const [systemTokens, setSystemTokens] = useState<number | null>(null)
  const [historyTokenCounts, setHistoryTokenCounts] = useState<number[] | null>(null)
  const [userInputTokens, setUserInputTokens] = useState<number | null>(null)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // The system prompt and the full canned history pool are fixed, so they
  // only need tokenizing once, up front.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const sys = await tokenize(SYSTEM_PROMPT)
        const historyResults = await Promise.all(HISTORY_POOL.map((t) => tokenize(t)))
        if (cancelled) return
        setSystemTokens(sys.length)
        setHistoryTokenCounts(historyResults.map((r) => r.length))
        setHasLoadedOnce(true)
      } catch {
        // error state is already surfaced via useTokenizer()
      }
    })()
    return () => {
      cancelled = true
    }
    // Runs once, since the pool and prompt above never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The live input box is debounced so every keystroke doesn't trigger a
  // worker round trip.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const trimmed = userInputText.trim()
      if (!trimmed) {
        setUserInputTokens(0)
        return
      }
      tokenize(trimmed)
        .then((result) => setUserInputTokens(result.length))
        .catch(() => {})
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [userInputText, tokenize])

  const visibleHistory = HISTORY_POOL.slice(0, historyCount)
  const visibleCounts = historyTokenCounts ? historyTokenCounts.slice(0, historyCount) : []

  const sys = systemTokens ?? 0
  const input = userInputTokens ?? 0

  // System prompt and the current user turn are always kept. History fills
  // whatever's left, most recent first: the oldest turns are the first to
  // get dropped once the budget runs out, same as a real sliding window.
  let remaining = windowSize - sys - input
  const kept: boolean[] = new Array(visibleHistory.length).fill(false)
  for (let i = visibleHistory.length - 1; i >= 0; i--) {
    const c = visibleCounts[i] ?? 0
    if (c <= remaining) {
      kept[i] = true
      remaining -= c
    } else {
      break
    }
  }

  const keptHistoryTokens = visibleCounts.reduce((sum, c, i) => (kept[i] ? sum + c : sum), 0)
  const usedTotal = sys + keptHistoryTokens + input
  const freeSpace = Math.max(0, windowSize - usedTotal)
  const overBudget = sys + input > windowSize
  const droppedCount = kept.filter((k) => !k).length

  const pct = (tokens: number) => `${Math.min(100, (tokens / windowSize) * 100)}%`

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Context windows</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Think of a context window as the model's short-term memory for this conversation. Its
          instructions, everything said so far, and your new message all have to fit inside that memory
          at once. Memory has a limit, and once it's full, the oldest things get forgotten to make room
          for what's happening now.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          That memory is measured in tokens, the same pieces from the Tokenization stage. Real models
          hold anywhere from a few thousand to a few hundred thousand tokens in memory at once. The
          sizes below are shrunk way down so you can actually watch memory fill up and overflow.
        </p>
      </div>

      {!hasLoadedOnce && status === 'loading-model' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">Loading tokenizer…</div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gray-900 transition-all"
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </div>
        </div>
      )}
      {status === 'error' && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Something went wrong: {error}
        </div>
      )}

      {hasLoadedOnce && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500">Memory size (context window)</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setWindowSize(opt.value)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  windowSize === opt.value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mt-4 h-8 w-full overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="flex h-full">
              <div className="h-full bg-blue-400" style={{ width: pct(sys) }} title={`instructions: ${sys} tokens`} />
              <div
                className="h-full bg-green-400"
                style={{ width: pct(keptHistoryTokens) }}
                title={`earlier conversation: ${keptHistoryTokens} tokens`}
              />
              <div className="h-full bg-amber-400" style={{ width: pct(input) }} title={`your message: ${input} tokens`} />
              {!overBudget && (
                <div className="h-full bg-gray-100" style={{ width: pct(freeSpace) }} title="room left in memory" />
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-400" />
              instructions: {sys}
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-400" />
              earlier conversation: {keptHistoryTokens}
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
              your message: {input}
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-gray-300" />
              room left: {overBudget ? 0 : freeSpace}
            </span>
            <span className="font-medium text-gray-700">
              {usedTotal} / {windowSize} tokens of memory used
            </span>
          </div>
          {overBudget && (
            <div className="mt-2 text-xs text-red-700">
              Your instructions and message alone don't fit in memory. Try a bigger size or a shorter
              message.
            </div>
          )}

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-500">Conversation so far</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryCount((c) => Math.max(0, c - 1))}
                  disabled={historyCount === 0}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove turn
                </button>
                <button
                  onClick={() => setHistoryCount((c) => Math.min(HISTORY_POOL.length, c + 1))}
                  disabled={historyCount >= HISTORY_POOL.length}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  + Add turn
                </button>
              </div>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {visibleHistory.map((turn, i) => (
                <li
                  key={i}
                  className={`rounded-md border p-2 text-xs ${
                    kept[i] ? 'border-gray-100 bg-gray-50 text-gray-700' : 'border-red-100 bg-red-50 text-red-400'
                  }`}
                >
                  <span className={kept[i] ? '' : 'line-through'}>{turn}</span>
                  <span className="ml-2 text-gray-400">({visibleCounts[i] ?? 0} tok)</span>
                  {!kept[i] && <span className="ml-1">(forgotten, no room left in memory)</span>}
                </li>
              ))}
            </ul>
            {droppedCount > 0 && (
              <div className="mt-1 text-xs text-red-700">
                {droppedCount} of the oldest turn{droppedCount === 1 ? '' : 's'} got forgotten to make
                room.
              </div>
            )}
          </div>

          <div className="mt-5">
            <div className="text-xs font-medium text-gray-500">Your message</div>
            <textarea
              value={userInputText}
              onChange={(e) => setUserInputText(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-md border border-gray-200 p-2 text-sm text-gray-800 focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>
      )}

      <p className="max-w-2xl text-sm text-gray-600">
        This is exactly why RAG doesn't just paste an entire knowledge base into the prompt: it has to
        fit in a budget like this one, which is why retrieval only injects the top few most relevant
        chunks instead of everything. See the{' '}
        <Link to="/rag" className="font-medium text-gray-900 underline">
          RAG tab
        </Link>{' '}
        for how that works.
      </p>
    </div>
  )
}
