import { useState } from 'react'
import { assemblePrompt, instructionFor } from '../../lib/promptAssembly'
import type { SearchResult } from '../../lib/retrieval'

interface PromptAssemblyStageProps {
  result: SearchResult | null
  topK: number
  strictGrounding: boolean
  onStrictGroundingChange: (value: boolean) => void
  onGoToRetrieval: () => void
}

export default function PromptAssemblyStage({
  result,
  topK,
  strictGrounding,
  onStrictGroundingChange,
  onGoToRetrieval,
}: PromptAssemblyStageProps) {
  const [copied, setCopied] = useState(false)

  const matches = result ? result.ranked.slice(0, topK) : []
  const prompt = result ? assemblePrompt(result.queryText, matches, { strictGrounding }) : ''
  const tokenEstimate = Math.round(prompt.length / 4)

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">4. Prompt assembly</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          The retrieved chunks aren't useful on their own — they get woven into one prompt alongside an
          instruction and the original question. This step is pure string templating, no model
          involved, but the choices here directly shape how the model in Stage 5 behaves.
        </p>
      </div>

      {!result && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          No query has been run yet — there's nothing to assemble.{' '}
          <button onClick={onGoToRetrieval} className="font-medium text-gray-900 underline">
            Go to Retrieval
          </button>
        </div>
      )}

      {result && (
        <>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={strictGrounding}
                onChange={(e) => onStrictGroundingChange(e.target.checked)}
                className="h-4 w-4 accent-gray-900"
              />
              Refuse to answer if the context doesn't contain it
            </label>
            <p className="mt-1 text-xs text-gray-500">
              {strictGrounding
                ? 'Strict grounding: the model is told to say "I don\'t know" rather than guess from its own training.'
                : "Loose grounding: the model may fall back on its own trained knowledge to fill gaps — more likely to answer, more likely to blend in something it wasn't actually shown."}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>
                {matches.length} chunk{matches.length === 1 ? '' : 's'}
              </span>
              <span>{prompt.length} characters</span>
              <span>~{tokenEstimate} tokens (rough estimate)</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800">The assembled prompt</h3>
            <p className="mb-2 text-xs text-gray-500">
              Instruction, then each retrieved chunk labeled with its source, then your question — in
              the order the model actually reads them.
            </p>
            <div className="flex flex-col gap-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm italic text-gray-600">
                {instructionFor({ strictGrounding })}
              </div>

              {matches.map((m, i) => (
                <div key={m.chunk.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: `var(--chunk-swatch-${m.chunk.docIndex % 8})` }}
                    />
                    <span className="font-medium text-gray-800">
                      [{i + 1}] {m.chunk.docTitle}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-gray-800">{m.chunk.text}</p>
                </div>
              ))}

              <div className="rounded-lg border border-gray-900 bg-gray-900 p-3 text-sm text-white">
                <span className="text-xs font-medium text-gray-400">Question</span>
                <p className="mt-1">{result.queryText}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Exactly what gets sent to the model</h3>
              <button
                onClick={handleCopy}
                className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="mt-2 max-h-80 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs whitespace-pre-wrap text-gray-800">
              {prompt}
            </pre>
          </div>
        </>
      )}
    </div>
  )
}
