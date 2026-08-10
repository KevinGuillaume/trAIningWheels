import { useEffect, useState } from 'react'
import { corpus } from '../../data/corpus'
import type { EmbeddableChunk } from '../../lib/embeddableChunks'
import type { Point2D } from '../../lib/pca'
import type { PlotLayout } from '../../lib/plotLayout'
import type { EmbedStatus } from '../../lib/useEmbeddings'

interface EmbeddingStageProps {
  chunks: EmbeddableChunk[]
  vectors: number[][] | null
  points: Point2D[] | null
  layout: PlotLayout | null
  status: EmbedStatus
  progress: number
  error: string | null
  onCompute: () => void
}

const FINGERPRINT_BUCKETS = 48

function bucketize(vector: number[], buckets: number): number[] {
  const size = Math.ceil(vector.length / buckets)
  const result: number[] = []
  for (let i = 0; i < vector.length; i += size) {
    const slice = vector.slice(i, i + size)
    result.push(slice.reduce((sum, v) => sum + v, 0) / slice.length)
  }
  return result
}

function fingerprintColor(value: number, maxAbs: number): string {
  const pct = Math.round((Math.abs(value) / (maxAbs || 1)) * 100)
  const pole = value >= 0 ? 'var(--diverging-pos)' : 'var(--diverging-neg)'
  return `color-mix(in oklab, ${pole} ${pct}%, var(--diverging-mid))`
}

export default function EmbeddingStage({
  chunks,
  vectors,
  points,
  layout,
  status,
  progress,
  error,
  onCompute,
}: EmbeddingStageProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'ready' && selectedIdx === null) setSelectedIdx(0)
  }, [status, selectedIdx])

  const plotData = (() => {
    if (!points || !layout) return null
    const { scaleX, scaleY } = layout

    const plotted = points.map((p, i) => ({
      chunk: chunks[i],
      cx: scaleX(p.x),
      cy: scaleY(p.y),
    }))

    const byDoc = new Map<number, { title: string; xs: number[]; ys: number[] }>()
    for (const item of plotted) {
      const entry = byDoc.get(item.chunk.docIndex) ?? { title: item.chunk.docTitle, xs: [], ys: [] }
      entry.xs.push(item.cx)
      entry.ys.push(item.cy)
      byDoc.set(item.chunk.docIndex, entry)
    }
    const centroids = Array.from(byDoc.entries()).map(([docIndex, e]) => ({
      docIndex,
      title: e.title,
      x: e.xs.reduce((a, b) => a + b, 0) / e.xs.length,
      y: e.ys.reduce((a, b) => a + b, 0) / e.ys.length,
    }))

    return { plotted, centroids }
  })()

  const selectedChunk = selectedIdx !== null ? chunks[selectedIdx] : null
  const selectedVector = selectedIdx !== null ? (vectors?.[selectedIdx] ?? undefined) : undefined
  const fingerprint = selectedVector ? bucketize(selectedVector, FINGERPRINT_BUCKETS) : null
  const fingerprintMaxAbs = fingerprint ? Math.max(...fingerprint.map(Math.abs)) : 1

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Embedding</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Each of the {chunks.length} chunks from Stage 1 gets converted into a 384-number vector by
          a real embedding model running entirely in your browser (HuggingFace for the win). So no
          server, no API key. The model weights (~23MB) download once and are cached for next time.
        </p>
      </div>

      {status === 'idle' && (
        <button
          onClick={onCompute}
          className="w-fit rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Compute embeddings
        </button>
      )}

      {status === 'loading-model' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm font-medium text-gray-700">Downloading model weights…</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gray-900 transition-all"
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </div>
        </div>
      )}

      {status === 'embedding' && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-700">
          Running {chunks.length} chunks through the model…
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Something went wrong: {error}
          <button onClick={onCompute} className="ml-2 font-medium underline">
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && plotData && layout && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Embedding space</h3>
            <p className="mb-2 text-xs text-gray-500">
              Each dot is one chunk, projected from 384 dimensions down to 2 with PCA. Chunks from the
              same topic should land near each other.
            </p>
            <div className="relative">
              <svg
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                className="h-auto w-full rounded-lg border border-gray-200 bg-white"
              >
                {plotData.centroids.map((c) => (
                  <text
                    key={c.docIndex}
                    x={c.x}
                    y={c.y - 12}
                    textAnchor="middle"
                    className="fill-gray-400"
                    style={{ fontSize: 9 }}
                  >
                    {c.title}
                  </text>
                ))}
                {plotData.plotted.map((item, i) => (
                  <circle
                    key={item.chunk.id}
                    cx={item.cx}
                    cy={item.cy}
                    r={hoveredIdx === i || selectedIdx === i ? 7 : 5}
                    fill={`var(--chunk-swatch-${item.chunk.docIndex % 8})`}
                    stroke="white"
                    strokeWidth={1.5}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx((cur) => (cur === i ? null : cur))}
                    onClick={() => setSelectedIdx(i)}
                  />
                ))}
              </svg>
              {hoveredIdx !== null && (
                <div
                  className="pointer-events-none absolute z-10 w-[200px] -translate-x-1/2 -translate-y-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs shadow-md"
                  style={{
                    left: `${(plotData.plotted[hoveredIdx].cx / layout.width) * 100}%`,
                    top: `${(plotData.plotted[hoveredIdx].cy / layout.height) * 100}%`,
                  }}
                >
                  <div className="font-medium text-gray-900">{chunks[hoveredIdx].docTitle}</div>
                  <div className="mt-0.5 text-gray-500">{chunks[hoveredIdx].text.slice(0, 90)}…</div>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
              {corpus.map((d, i) => (
                <span key={d.id} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: `var(--chunk-swatch-${i % 8})` }}
                  />
                  {d.title}
                </span>
              ))}
            </div>
          </div>

          {selectedChunk && fingerprint && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500">{selectedChunk.docTitle} — selected chunk</div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{selectedChunk.text}</p>

              <div className="mt-3 text-xs font-medium text-gray-500">
                Its embedding, as a vector fingerprint
              </div>
              <div className="mt-1 flex h-8 w-full overflow-hidden rounded-md border border-gray-200">
                {fingerprint.map((value, i) => (
                  <div
                    key={i}
                    className="h-full flex-1"
                    style={{ backgroundColor: fingerprintColor(value, fingerprintMaxAbs) }}
                    title={value.toFixed(3)}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                384 numbers, averaged down to {FINGERPRINT_BUCKETS} bars. Blue = positive, red =
                negative, intensity = magnitude. Click any dot above to inspect a different chunk.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
