import { useMemo, useState } from 'react'
import ChunkingStage from './rag/ChunkingStage'
import EmbeddingStage from './rag/EmbeddingStage'
import RetrievalStage from './rag/RetrievalStage'
import { buildEmbeddableChunks } from '../lib/embeddableChunks'
import { fitPCA2D } from '../lib/pca'
import { createPlotLayout } from '../lib/plotLayout'
import { useEmbeddings } from '../lib/useEmbeddings'

const PLOT_WIDTH = 480
const PLOT_HEIGHT = 320
const PLOT_PADDING = 36

const STAGES = [
  { id: 'chunking', label: 'Chunking', available: true },
  { id: 'embedding', label: 'Embedding', available: true },
  { id: 'retrieval', label: 'Retrieval', available: true },
  { id: 'prompt', label: 'Prompt assembly', available: false },
  { id: 'generation', label: 'Generation', available: false },
] as const

type StageId = (typeof STAGES)[number]['id']

export default function Rag() {
  const [activeStage, setActiveStage] = useState<StageId>('chunking')

  // Shared across Embedding and Retrieval: both need the same chunk set, the
  // same computed vectors, and the same PCA axes so a query lands in a space
  // that's consistent with what Embedding already showed.
  const chunks = useMemo(buildEmbeddableChunks, [])
  const { embed, status, progress, error } = useEmbeddings()
  const [vectors, setVectors] = useState<number[][] | null>(null)
  const pcaFit = useMemo(() => (vectors ? fitPCA2D(vectors) : null), [vectors])
  const plotLayout = useMemo(
    () => (pcaFit ? createPlotLayout(pcaFit.points, PLOT_WIDTH, PLOT_HEIGHT, PLOT_PADDING) : null),
    [pcaFit],
  )

  const computeCorpusEmbeddings = async () => {
    setVectors(null)
    try {
      const result = await embed(chunks.map((c) => c.text))
      setVectors(result)
    } catch {
      // error state is already surfaced via useEmbeddings()
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">RAG, step by step</h1>
        <p className="mt-1 text-sm text-gray-600">
          A walkthrough of retrieval-augmented generation, one pipeline stage at a time.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {STAGES.map((stage, i) => (
          <button
            key={stage.id}
            disabled={!stage.available}
            onClick={() => setActiveStage(stage.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              !stage.available
                ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                : stage.id === activeStage
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {i + 1}. {stage.label}
            {!stage.available && <span className="ml-1.5 text-gray-300">soon</span>}
          </button>
        ))}
      </div>

      {activeStage === 'chunking' && <ChunkingStage />}
      {activeStage === 'embedding' && (
        <EmbeddingStage
          chunks={chunks}
          vectors={vectors}
          points={pcaFit?.points ?? null}
          layout={plotLayout}
          status={status}
          progress={progress}
          error={error}
          onCompute={computeCorpusEmbeddings}
        />
      )}
      {activeStage === 'retrieval' && (
        <RetrievalStage
          chunks={chunks}
          vectors={vectors}
          pcaFit={pcaFit}
          layout={plotLayout}
          embed={embed}
          corpusStatus={status}
          corpusProgress={progress}
          onComputeCorpus={computeCorpusEmbeddings}
        />
      )}
    </div>
  )
}
