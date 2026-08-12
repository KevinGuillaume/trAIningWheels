import { useState } from 'react'
import ToolLoopStage from './agents/ToolLoopStage'
import WhatIsAnAgentStage from './agents/WhatIsAnAgentStage'
import PipelineDiagram from './rag/PipelineDiagram'

const STAGES = [
  { id: 'intro', label: 'What is an agent', available: true },
  { id: 'tools', label: 'Watch it run', available: true },
] as const

type StageId = (typeof STAGES)[number]['id']

export default function Agents() {
  const [activeStage, setActiveStage] = useState<StageId>('intro')
  const currentStageLabel = STAGES.find((s) => s.id === activeStage)?.label ?? ''

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Agents</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          An AI agent is a model given the ability to take actions and a loop that lets it decide, on
          its own, when to take them. This tab walks through what that actually means and lets you watch
          it happen.
        </p>
      </div>

      <div className="border-b border-gray-200 pb-4">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">Agents</h2>
        <PipelineDiagram<StageId> stages={STAGES} activeStage={activeStage} onSelect={setActiveStage} />
      </div>

      <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
        Current Step: <span className="text-gray-900">{currentStageLabel}</span>
      </h2>

      {activeStage === 'intro' && <WhatIsAnAgentStage />}
      {activeStage === 'tools' && <ToolLoopStage />}
    </div>
  )
}
