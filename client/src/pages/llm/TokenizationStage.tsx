import { useState } from 'react'
import type { TokenizeStatus } from '../../lib/useTokenizer'
import type { WorkerToken } from '../../workers/tokenizerWorker'

interface TokenizationStageProps {
  tokenize: (text: string) => Promise<WorkerToken[]>
  status: TokenizeStatus
  progress: number
  error: string | null
}

const SUGGESTIONS = [
  'Tokenization is how a model reads text.',
  'internationalization',
  '2026 was an Olympic year.',
]

// Cycled by chip index so adjacent tokens are visually distinct. The colors
// carry no other meaning.
const PALETTE = [
  'bg-blue-100 text-blue-900',
  'bg-green-100 text-green-900',
  'bg-amber-100 text-amber-900',
  'bg-pink-100 text-pink-900',
  'bg-purple-100 text-purple-900',
  'bg-teal-100 text-teal-900',
]

export default function TokenizationStage({ tokenize, status, progress, error }: TokenizationStageProps) {
  const [inputText, setInputText] = useState(SUGGESTIONS[0])
  const [tokens, setTokens] = useState<WorkerToken[] | null>(null)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const isBusy = status === 'loading-model' || status === 'tokenizing'

  const runTokenize = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    try {
      const result = await tokenize(text)
      setHasLoadedOnce(true)
      setTokens(result)
    } catch {
      // error state is already surfaced via useTokenizer()
    }
  }

  const charCount = inputText.length
  const tokenCount = tokens?.length ?? 0
  const charsPerToken = tokenCount > 0 ? (charCount / tokenCount).toFixed(1) : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Tokenization</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          A model never sees letters or whole words. It sees tokens: chunks of text from a fixed
          vocabulary the tokenizer learned during training. Common words are often a single token; rarer
          or longer words get split into several pieces.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Below is the same tokenizer the Qwen2.5-0.5B-Instruct model (from the "What is an LLM" and RAG
          Generation stages) actually uses. Type something and see how it gets split up.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-xs font-medium text-gray-500">Text to tokenize</div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={2}
          className="mt-1 w-full resize-none rounded-md border border-gray-200 p-2 text-sm text-gray-800 focus:border-gray-400 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setInputText(s)
                runTokenize(s)
              }}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-900"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => runTokenize(inputText)}
          disabled={isBusy || !inputText.trim()}
          className="mt-3 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isBusy ? 'Tokenizing…' : 'Tokenize'}
        </button>

        {status === 'loading-model' && !hasLoadedOnce && (
          <div className="mt-3">
            <div className="text-xs text-gray-500">Downloading tokenizer files…</div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gray-900 transition-all"
                style={{ width: `${Math.max(4, progress)}%` }}
              />
            </div>
          </div>
        )}
        {status === 'error' && error && <div className="mt-3 text-sm text-red-700">Something went wrong: {error}</div>}

        {tokens && (
          <>
            <div className="mt-4 flex flex-wrap gap-1 rounded-md border border-gray-100 bg-gray-50 p-3">
              {tokens.map((t, i) => (
                <span
                  key={i}
                  title={`token id: ${t.id}`}
                  className={`rounded px-1.5 py-0.5 font-mono text-sm whitespace-pre ${PALETTE[i % PALETTE.length]}`}
                >
                  {t.text.length > 0 ? t.text : '∅'}
                </span>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {tokenCount} token{tokenCount === 1 ? '' : 's'} · {charCount} character
              {charCount === 1 ? '' : 's'} · ~{charsPerToken} characters per token
            </div>
          </>
        )}
      </div>
    </div>
  )
}
