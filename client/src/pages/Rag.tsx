import { useState } from 'react'
import ChunkingStage from './rag/ChunkingStage'
import EmbeddingStage from './rag/EmbeddingStage'

const STAGES = [
  { id: 'chunking', label: 'Chunking', available: true },
  { id: 'embedding', label: 'Embedding', available: true },
  { id: 'retrieval', label: 'Retrieval', available: false },
  { id: 'prompt', label: 'Prompt assembly', available: false },
  { id: 'generation', label: 'Generation', available: false },
] as const

type StageId = (typeof STAGES)[number]['id']

export default function Rag() {
  const [activeStage, setActiveStage] = useState<StageId>('chunking')

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
      {activeStage === 'embedding' && <EmbeddingStage />}
    </div>
  )
}
