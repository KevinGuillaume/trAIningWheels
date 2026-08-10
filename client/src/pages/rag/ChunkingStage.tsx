import { useMemo, useState } from 'react'
import { corpus } from '../../data/corpus'
import { chunkDocument } from '../../lib/chunking'

const MIN_CHARS = 60
const MAX_CHARS = 700

interface ChunkingStageProps {
  maxChars: number
  onMaxCharsChange: (value: number) => void
  chunkCount: number
}

export default function ChunkingStage({ maxChars, onMaxCharsChange, chunkCount }: ChunkingStageProps) {
  const [docId, setDocId] = useState(corpus[0].id)

  const doc = corpus.find((d) => d.id === docId) ?? corpus[0]
  const chunks = useMemo(() => chunkDocument(doc.text, maxChars), [doc.text, maxChars])

  const hardSplitCount = chunks.filter((c) => c.hardSplit).length
  const mergedCount = chunks.filter((c) => c.paragraphCount > 1).length
  const avgLen = Math.round(chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Chunking</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Documents get split into chunks before anything else happens. Drag the slider to change
          the max chunk size and watch what happens at the extremes: too small and paragraphs get
          sliced mid-sentence; too large and unrelated paragraphs get merged into one chunk.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          This is the same setting used to chunk your whole knowledge base — right now that's{' '}
          <span className="font-medium text-gray-700">{chunkCount} chunks</span> across all documents,
          feeding Stage 2 onward.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800">Your Knowledge Source</h3>
        <p className="mb-2 text-xs text-gray-500">Documents</p>
        <div className="flex flex-wrap gap-2">
          {corpus.map((d) => (
            <button
              key={d.id}
              onClick={() => setDocId(d.id)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                d.id === docId ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d.title}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="chunk-size" className="text-sm font-medium text-gray-700">
            Max chunk size: <span className="tabular-nums text-gray-900">{maxChars}</span> chars
          </label>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>{chunks.length} chunks</span>
            <span>avg {avgLen} chars</span>
          </div>
        </div>
        <input
          id="chunk-size"
          type="range"
          min={MIN_CHARS}
          max={MAX_CHARS}
          step={10}
          value={maxChars}
          onChange={(e) => onMaxCharsChange(Number(e.target.value))}
          className="mt-3 w-full accent-gray-900"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>small — expect mid-sentence cuts</span>
          <span>large — expect merged paragraphs</span>
        </div>
      </div>

      {(hardSplitCount > 0 || mergedCount > 0) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {hardSplitCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fab219]/15 px-2.5 py-1 font-medium text-[#8a5a00]">
              ⚠ {hardSplitCount} chunk{hardSplitCount === 1 ? '' : 's'} cut mid-sentence
            </span>
          )}
          {mergedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
              ⓘ {mergedCount} chunk{mergedCount === 1 ? '' : 's'} span multiple paragraphs
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {chunks.map((chunk, i) => (
          <div
            key={chunk.id}
            className="rounded-lg border border-gray-200 p-3"
            style={{ backgroundColor: `var(--chunk-color-${i % 8})` }}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: `var(--chunk-swatch-${i % 8})` }}
              />
              <span className="font-medium text-gray-800">Chunk {i + 1}</span>
              <span>{chunk.text.length} chars</span>
              {chunk.hardSplit && (
                <span className="font-medium text-[#8a5a00]">⚠ mid-sentence cut</span>
              )}
              {chunk.paragraphCount > 1 && <span>{chunk.paragraphCount} paragraphs merged</span>}
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-800">{chunk.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
