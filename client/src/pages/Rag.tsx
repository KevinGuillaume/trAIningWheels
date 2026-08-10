import { useMemo, useState } from 'react'
import PipelineDiagram from './rag/PipelineDiagram'
import ChunkingStage from './rag/ChunkingStage'
import EmbeddingStage from './rag/EmbeddingStage'
import RetrievalStage from './rag/RetrievalStage'
import PromptAssemblyStage from './rag/PromptAssemblyStage'
import GenerationStage from './rag/GenerationStage'
import { DEFAULT_MAX_CHARS } from '../lib/chunking'
import { buildEmbeddableChunks } from '../lib/embeddableChunks'
import { fitPCA2D } from '../lib/pca'
import { createPlotLayout } from '../lib/plotLayout'
import { runRetrieval, type SearchResult } from '../lib/retrieval'
import { useEmbeddings } from '../lib/useEmbeddings'

const PLOT_WIDTH = 480
const PLOT_HEIGHT = 320
const PLOT_PADDING = 36

const STAGES = [
  { id: 'chunking', label: 'Chunking', available: true },
  { id: 'embedding', label: 'Embedding', available: true },
  { id: 'retrieval', label: 'Retrieval', available: true },
  { id: 'prompt', label: 'Prompt assembly', available: true },
  { id: 'generation', label: 'Generation', available: true },
] as const

type StageId = (typeof STAGES)[number]['id']

// Chunking and embedding build the corpus index once, up front. Retrieval,
// prompt assembly, and generation all happen fresh for every question asked
// against that index — including a second, on-the-fly use of the embedding
// model to embed the query itself.
const STAGE_GROUPS = [
  { label: 'Populate the index', span: 2 },
  { label: 'Answer a query', span: 3 },
] as const

export default function Rag() {
  const [activeStage, setActiveStage] = useState<StageId>('chunking')
  const currentStageLabel = STAGES.find((s) => s.id === activeStage)?.label ?? ''

  // Shared across Chunking, Embedding, Retrieval, and Prompt assembly: all
  // stages need the same chunk set, the same computed vectors, and the same
  // PCA axes so a query lands in a space that's consistent with what
  // Embedding already showed.
  const [maxChars, setMaxChars] = useState(DEFAULT_MAX_CHARS)
  const chunks = useMemo(() => buildEmbeddableChunks(maxChars), [maxChars])
  const { embed, status, progress, error, reset: resetEmbeddings } = useEmbeddings()
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

  // Retrieval state lives here (not inside RetrievalStage) because Prompt
  // assembly needs to pick up wherever the last search left off.
  const [queryText, setQueryText] = useState('')
  const [topK, setTopK] = useState(3)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [strictGrounding, setStrictGrounding] = useState(true)

  // Changing maxChars changes the corpus's chunk boundaries, which makes any
  // previously computed vectors and search results stale — clear them here,
  // right where the change originates, rather than reacting to it after the
  // fact.
  const handleMaxCharsChange = (value: number) => {
    setMaxChars(value)
    setVectors(null)
    setSearchResult(null)
    setSearchError(null)
    resetEmbeddings()
  }

  const runSearch = async (text: string) => {
    const query = text.trim()
    if (!query || !vectors || !pcaFit) return

    setIsSearching(true)
    setSearchError(null)
    try {
      const result = await runRetrieval(query, chunks, vectors, pcaFit, embed)
      setSearchResult(result)
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">RAG, step by step</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          RAG (Retrieval-Augmented Generation) lets a language model answer using facts it was never
          trained on. Rather than trusting the model's memory alone, you first{' '}
          <span className="underline decoration-gray-400 underline-offset-2">populate the index</span>{' '}
          from your own documents ahead of time, then{' '}
          <span className="underline decoration-gray-400 underline-offset-2">answer a query</span> by
          searching that index for the most relevant pieces and handing them to the model as context
          before it generates a reply.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          This is what makes RAG so useful in practice: point it at your company's handbooks, policies,
          or internal docs, and a model can answer questions grounded in that specific knowledge
          without retraining it every time that knowledge changes.
        </p>
      </div>

      <div className="border-b border-gray-200 pb-4">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">RAG Pipeline</h2>
        <PipelineDiagram<StageId>
          stages={STAGES}
          groups={STAGE_GROUPS}
          activeStage={activeStage}
          onSelect={setActiveStage}
        />
      </div>

      <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
        Current Step: <span className="text-gray-900">{currentStageLabel}</span>
      </h2>

      {activeStage === 'chunking' && (
        <ChunkingStage maxChars={maxChars} onMaxCharsChange={handleMaxCharsChange} chunkCount={chunks.length} />
      )}
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
          corpusStatus={status}
          corpusProgress={progress}
          onComputeCorpus={computeCorpusEmbeddings}
          queryText={queryText}
          onQueryTextChange={setQueryText}
          topK={topK}
          onTopKChange={setTopK}
          isSearching={isSearching}
          searchError={searchError}
          result={searchResult}
          onSearch={runSearch}
        />
      )}
      {activeStage === 'prompt' && (
        <PromptAssemblyStage
          result={searchResult}
          topK={topK}
          strictGrounding={strictGrounding}
          onStrictGroundingChange={setStrictGrounding}
          onGoToRetrieval={() => setActiveStage('retrieval')}
        />
      )}
      {activeStage === 'generation' && (
        <GenerationStage
          result={searchResult}
          topK={topK}
          strictGrounding={strictGrounding}
          onGoToPrompt={() => setActiveStage('prompt')}
        />
      )}
    </div>
  )
}
