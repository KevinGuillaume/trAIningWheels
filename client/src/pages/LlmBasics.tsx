import { useState } from 'react'
import ContextWindowStage from './llm/ContextWindowStage'
import IntroStage from './llm/IntroStage'
import TokenizationStage from './llm/TokenizationStage'
import PipelineDiagram from './rag/PipelineDiagram'
import { useTokenizer } from '../lib/useTokenizer'

const STAGES = [
  { id: 'intro', label: 'What is an LLM', available: true },
  { id: 'tokenization', label: 'Tokenization', available: true },
  { id: 'context', label: 'Context windows', available: true },
] as const

type StageId = (typeof STAGES)[number]['id']

export default function LlmBasics() {
  const [activeStage, setActiveStage] = useState<StageId>('intro')
  const currentStageLabel = STAGES.find((s) => s.id === activeStage)?.label ?? ''

  // Shared between Tokenization and (eventually) Context windows so both
  // stages count tokens with the exact same tokenizer instance.
  const { tokenize, status: tokenizeStatus, progress: tokenizeProgress, error: tokenizeError } = useTokenizer()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">LLM basics</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Before RAG, retrieval, or prompt engineering make sense, it helps to know what a language
          model actually is, how it reads the text you give it, and how much of that text it can hold
          onto at once. This tab covers those fundamentals on their own, hands-on.
        </p>
      </div>

      <div className="border-b border-gray-200 pb-4">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">Fundamentals</h2>
        <PipelineDiagram<StageId> stages={STAGES} activeStage={activeStage} onSelect={setActiveStage} />
      </div>

      <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
        Current Step: <span className="text-gray-900">{currentStageLabel}</span>
      </h2>

      {activeStage === 'intro' && <IntroStage />}
      {activeStage === 'tokenization' && (
        <TokenizationStage
          tokenize={tokenize}
          status={tokenizeStatus}
          progress={tokenizeProgress}
          error={tokenizeError}
        />
      )}
      {activeStage === 'context' && (
        <ContextWindowStage
          tokenize={tokenize}
          status={tokenizeStatus}
          progress={tokenizeProgress}
          error={tokenizeError}
        />
      )}
    </div>
  )
}
