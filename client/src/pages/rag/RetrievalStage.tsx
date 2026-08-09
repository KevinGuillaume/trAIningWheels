import { useState } from 'react'
import type { EmbeddableChunk } from '../../lib/embeddableChunks'
import type { PCAFit, Point2D } from '../../lib/pca'
import type { PlotLayout } from '../../lib/plotLayout'
import { cosineSimilarity } from '../../lib/vectorMath'
import type { EmbedStatus } from '../../lib/useEmbeddings'

interface RetrievalStageProps {
  chunks: EmbeddableChunk[]
  vectors: number[][] | null
  pcaFit: PCAFit | null
  layout: PlotLayout | null
  embed: (texts: string[]) => Promise<number[][]>
  corpusStatus: EmbedStatus
  corpusProgress: number
  onComputeCorpus: () => void
}

interface RankedChunk {
  chunk: EmbeddableChunk
  score: number
}

interface SearchResult {
  queryPoint: Point2D
  ranked: RankedChunk[]
}

const SUGGESTIONS = [
  'Who won the Super Bowl?',
  'How many medals did Norway win?',
  'Which teams are leading MLB right now?',
  'Who won Wimbledon?',
]

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value))
}

export default function RetrievalStage({
  chunks,
  vectors,
  pcaFit,
  layout,
  embed,
  corpusStatus,
  corpusProgress,
  onComputeCorpus,
}: RetrievalStageProps) {
  const [queryText, setQueryText] = useState('')
  const [topK, setTopK] = useState(Math.min(3, chunks.length))
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [result, setResult] = useState<SearchResult | null>(null)

  const runSearch = async (text: string) => {
    const query = text.trim()
    if (!query || !vectors || !pcaFit) return

    setIsSearching(true)
    setSearchError(null)
    try {
      const [queryVector] = await embed([query])
      const queryPoint = pcaFit.project(queryVector)
      const ranked = chunks
        .map((chunk, i) => ({ chunk, score: cosineSimilarity(queryVector, vectors[i]) }))
        .sort((a, b) => b.score - a.score)
      setResult({ queryPoint, ranked })
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSearching(false)
    }
  }

  const plotData = (() => {
    if (!pcaFit || !layout || !result) return null
    const { scaleX, scaleY, width, height, padding } = layout

    // Same layout instance Embedding used — a chunk lands at the identical pixel
    // position in both stages. The query wasn't part of that fit, so its raw
    // projection can fall outside the corpus's bounding box; clamp it into the
    // padded area for display (an oddball query showing up pinned to the edge is
    // itself informative — it means "far from everything in the corpus").
    const plotted = pcaFit.points.map((p, i) => ({ chunk: chunks[i], cx: scaleX(p.x), cy: scaleY(p.y) }))
    const plottedById = new Map(plotted.map((p) => [p.chunk.id, p]))
    const queryCx = clamp(scaleX(result.queryPoint.x), padding, width - padding)
    const queryCy = clamp(scaleY(result.queryPoint.y), padding, height - padding)

    return { plotted, plottedById, queryCx, queryCy, width, height }
  })()

  const topMatches = result ? result.ranked.slice(0, topK) : []
  const topScores = topMatches.map((m) => m.score)
  const minScore = Math.min(...topScores)
  const maxScore = Math.max(...topScores)
  const scoreSpan = maxScore - minScore || 1

  const corpusReady = vectors !== null && pcaFit !== null && layout !== null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">3. Retrieval</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Type a question, and it gets embedded with the exact same model used on the corpus. Because
          those vectors are normalized, comparing the query to every chunk is just a dot product —
          that's cosine similarity. The highest-scoring chunks get pulled out as the retrieved context.
        </p>
      </div>

      {!corpusReady && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          {corpusStatus === 'loading-model' && (
            <>Downloading model weights… {Math.round(corpusProgress)}%</>
          )}
          {corpusStatus === 'embedding' && <>Embedding the corpus…</>}
          {(corpusStatus === 'idle' || corpusStatus === 'error') && (
            <>
              The corpus hasn't been embedded yet — there's nothing to search against.{' '}
              <button onClick={onComputeCorpus} className="font-medium text-gray-900 underline">
                Compute embeddings
              </button>
            </>
          )}
        </div>
      )}

      {corpusReady && (
        <>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <label htmlFor="query" className="text-sm font-medium text-gray-700">
              Your question
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="query"
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch(queryText)}
                placeholder="e.g. Who won the Super Bowl?"
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-gray-500 focus:outline-none"
              />
              <button
                onClick={() => runSearch(queryText)}
                disabled={isSearching || !queryText.trim()}
                className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSearching ? 'Searching…' : 'Search'}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQueryText(s)
                    runSearch(s)
                  }}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <label htmlFor="top-k" className="text-sm font-medium text-gray-700">
                Retrieve top <span className="tabular-nums text-gray-900">{topK}</span> chunk
                {topK === 1 ? '' : 's'}
              </label>
            </div>
            <input
              id="top-k"
              type="range"
              min={1}
              max={chunks.length}
              step={1}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="mt-2 w-full accent-gray-900"
            />
          </div>

          {searchError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Something went wrong: {searchError}
            </div>
          )}

          {result && plotData && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Where the query landed</h3>
                <p className="mb-2 text-xs text-gray-500">
                  The dark diamond is your query, plotted on the same axes as Stage 2. Lines connect it
                  to the top {topK} matches — thicker and darker means higher similarity.
                </p>
                <svg
                  viewBox={`0 0 ${plotData.width} ${plotData.height}`}
                  className="h-auto w-full rounded-lg border border-gray-200 bg-white"
                >
                  {topMatches.map(({ chunk, score }) => {
                    const target = plotData.plottedById.get(chunk.id)
                    if (!target) return null
                    const t = (score - minScore) / scoreSpan
                    return (
                      <line
                        key={chunk.id}
                        x1={plotData.queryCx}
                        y1={plotData.queryCy}
                        x2={target.cx}
                        y2={target.cy}
                        stroke="var(--diverging-pos)"
                        strokeWidth={1.5 + t * 2.5}
                        strokeOpacity={0.35 + t * 0.55}
                      />
                    )
                  })}
                  {plotData.plotted.map((item) => {
                    const isMatch = topMatches.some((m) => m.chunk.id === item.chunk.id)
                    return (
                      <circle
                        key={item.chunk.id}
                        cx={item.cx}
                        cy={item.cy}
                        r={isMatch ? 6.5 : 4.5}
                        fill={`var(--chunk-swatch-${item.chunk.docIndex % 8})`}
                        stroke="white"
                        strokeWidth={1.5}
                        opacity={isMatch ? 1 : 0.45}
                      />
                    )
                  })}
                  <rect
                    x={plotData.queryCx - 6}
                    y={plotData.queryCy - 6}
                    width={12}
                    height={12}
                    fill="#111827"
                    stroke="white"
                    strokeWidth={1.5}
                    transform={`rotate(45 ${plotData.queryCx} ${plotData.queryCy})`}
                  />
                  <text
                    x={plotData.queryCx}
                    y={plotData.queryCy - 14}
                    textAnchor="middle"
                    className="fill-gray-700"
                    style={{ fontSize: 10, fontWeight: 600 }}
                  >
                    query
                  </text>
                </svg>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-gray-800">Retrieved chunks</h3>
                {topMatches.map(({ chunk, score }, rank) => (
                  <div key={chunk.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: `var(--chunk-swatch-${chunk.docIndex % 8})` }}
                      />
                      <span className="font-medium text-gray-800">
                        #{rank + 1} · {chunk.docTitle}
                      </span>
                      <span className="ml-auto tabular-nums text-gray-500">{score.toFixed(3)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gray-900"
                        style={{ width: `${Math.max(4, score * 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{chunk.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
