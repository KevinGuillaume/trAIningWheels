import { useState } from 'react'
import { assembleGroundedMessages, assembleUngroundedMessages } from '../../lib/promptAssembly'
import type { SearchResult } from '../../lib/retrieval'
import { useGeneration } from '../../lib/useGeneration'

interface GenerationStageProps {
  result: SearchResult | null
  topK: number
  strictGrounding: boolean
  onGoToPrompt: () => void
}

type RunStage = 'idle' | 'ungrounded' | 'grounded' | 'done'

export default function GenerationStage({ result, topK, strictGrounding, onGoToPrompt }: GenerationStageProps) {
  const { generate, status, progress, error } = useGeneration()
  const [runStage, setRunStage] = useState<RunStage>('idle')
  const [ungroundedAnswer, setUngroundedAnswer] = useState<string | null>(null)
  const [groundedAnswer, setGroundedAnswer] = useState<string | null>(null)

  const matches = result ? result.ranked.slice(0, topK) : []
  const isRunning = runStage === 'ungrounded' || runStage === 'grounded'

  const handleRun = async () => {
    if (!result) return
    setUngroundedAnswer(null)
    setGroundedAnswer(null)

    try {
      setRunStage('ungrounded')
      const ungrounded = await generate(assembleUngroundedMessages(result.queryText))
      setUngroundedAnswer(ungrounded)

      setRunStage('grounded')
      const grounded = await generate(assembleGroundedMessages(result.queryText, matches, { strictGrounding }))
      setGroundedAnswer(grounded)

      setRunStage('done')
    } catch {
      setRunStage('idle')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">5. Generation</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          A real small language model (Qwen2.5-0.5B-Instruct, in-browser, ~300MB, cached after first
          load) answers your question twice: once with nothing but its own training, once with the
          prompt assembled in Stage 4. Same model, same question but the only difference is retrieval.
        </p>
      </div>

      {!result && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          No prompt has been assembled yet.{' '}
          <button onClick={onGoToPrompt} className="font-medium text-gray-900 underline">
            Go to Prompt assembly
          </button>
        </div>
      )}

      {result && (
        <>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            ⚠ Heads up, first run downloads the ~300MB generation model:  This can take a while depending on your
            connection, and each answer can take up to a minute or so to generate on CPU. Both get much
            faster after the first load.
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">Question</div>
            <p className="mt-1 text-sm text-gray-800">{result.queryText}</p>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="mt-3 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isRunning ? 'Generating…' : 'Generate answers'}
            </button>

            {status === 'loading-model' && (
              <div className="mt-3">
                <div className="text-xs text-gray-500">Downloading generation model weights…</div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gray-900 transition-all"
                    style={{ width: `${Math.max(4, progress)}%` }}
                  />
                </div>
              </div>
            )}
            {status === 'generating' && (
              <div className="mt-3 text-xs text-gray-500">
                {runStage === 'ungrounded' ? 'Thinking, without retrieval…' : 'Thinking, with retrieval…'}
              </div>
            )}
            {status === 'error' && error && (
              <div className="mt-3 text-sm text-red-700">Something went wrong: {error}</div>
            )}
          </div>

          {(ungroundedAnswer !== null || groundedAnswer !== null) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-xs font-semibold text-gray-500">Without retrieval</div>
                <p className="mt-1 text-xs text-gray-400">The model, using only what it learned in training.</p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800">
                  {ungroundedAnswer ?? '…'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-900 bg-white p-4">
                <div className="text-xs font-semibold text-gray-900">With retrieval (RAG)</div>
                <p className="mt-1 text-xs text-gray-400">
                  Grounded in {matches.length} chunk{matches.length === 1 ? '' : 's'} from Stage 3.
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800">{groundedAnswer ?? '…'}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
