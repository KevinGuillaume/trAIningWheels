import ChunkingStage from './rag/ChunkingStage'

const STAGES = [
  { id: 'chunking', label: 'Chunking', available: true },
  { id: 'embedding', label: 'Embedding', available: false },
  { id: 'retrieval', label: 'Retrieval', available: false },
  { id: 'prompt', label: 'Prompt assembly', available: false },
  { id: 'generation', label: 'Generation', available: false },
]

export default function Rag() {
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
          <span
            key={stage.id}
            className={`rounded-md px-3 py-1.5 text-sm ${
              stage.available
                ? 'bg-gray-900 text-white'
                : 'bg-gray-50 text-gray-400'
            }`}
          >
            {i + 1}. {stage.label}
            {!stage.available && <span className="ml-1.5 text-gray-300">soon</span>}
          </span>
        ))}
      </div>

      <ChunkingStage />
    </div>
  )
}
