function ArrowHead({ x, y, rotate }: { x: number; y: number; rotate: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path d="M-6,-4 L2,0 L-6,4 Z" fill="currentColor" />
    </g>
  )
}

function AgentLoopDiagram() {
  return (
    <svg viewBox="-20 0 420 340" className="h-auto w-full max-w-md text-gray-300">
      <line x1={140} y1={66} x2={140} y2={132} stroke="currentColor" strokeWidth={1.5} />
      <ArrowHead x={140} y={140} rotate={90} />

      <line x1={140} y1={196} x2={140} y2={262} stroke="currentColor" strokeWidth={1.5} />
      <ArrowHead x={140} y={270} rotate={90} />

      <line x1={240} y1={168} x2={272} y2={168} stroke="currentColor" strokeWidth={1.5} />
      <ArrowHead x={280} y={168} rotate={0} />

      <path d="M40,298 L0,298 L0,38 L32,38" fill="none" stroke="currentColor" strokeWidth={1.5} />
      <ArrowHead x={40} y={38} rotate={0} />

      <g className="text-gray-900">
        <rect x={40} y={10} width={200} height={56} rx={10} fill="white" stroke="currentColor" strokeWidth={1.5} />
        <text x={140} y={33} textAnchor="middle" fontSize={13} fontWeight={600} fill="currentColor">
          Perceive
        </text>
        <text x={140} y={49} textAnchor="middle" fontSize={9.5} fill="#6b7280">
          conversation + tool results so far
        </text>

        <rect x={40} y={140} width={200} height={56} rx={10} fill="white" stroke="currentColor" strokeWidth={1.5} />
        <text x={140} y={163} textAnchor="middle" fontSize={13} fontWeight={600} fill="currentColor">
          Decide
        </text>
        <text x={140} y={179} textAnchor="middle" fontSize={9.5} fill="#6b7280">
          the model picks the next move
        </text>

        <rect x={40} y={270} width={200} height={56} rx={10} fill="white" stroke="currentColor" strokeWidth={1.5} />
        <text x={140} y={293} textAnchor="middle" fontSize={13} fontWeight={600} fill="currentColor">
          Act
        </text>
        <text x={140} y={309} textAnchor="middle" fontSize={9.5} fill="#6b7280">
          the harness runs the chosen tool
        </text>

        <rect x={280} y={140} width={100} height={56} rx={10} fill="#f9fafb" stroke="currentColor" strokeWidth={1.5} />
        <text x={330} y={163} textAnchor="middle" fontSize={12} fontWeight={600} fill="currentColor">
          Final answer
        </text>
        <text x={330} y={179} textAnchor="middle" fontSize={9} fill="#6b7280">
          loop stops here
        </text>
      </g>
    </svg>
  )
}

export default function WhatIsAnAgentStage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">What is an agent?</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          An AI agent isn't a different or smarter kind of model. It's the same kind of large language
          model as the rest of this app, wrapped in a small piece of surrounding code, a harness, that
          gives it two things: a menu of actions it's allowed to take, and a loop that keeps asking it
          what to do next.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Prompting a model and reading its answer isn't what makes something an agent. Every other tab
          in this app already does that. What makes it an agent is what happens to the model's answer
          next: instead of just being shown to you, it gets sent off and actually carried out. A real
          function runs, something happens outside the model, and the result comes back in as new input
          instead of just being displayed as text.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          The important part is who's in charge of deciding whether that happens. In a fixed pipeline,
          the sequence of steps is decided ahead of time by whoever wrote the code: step one always
          happens, then step two always happens. An agent's harness doesn't decide the next step itself.
          It asks the model, every single iteration, and only carries out whatever the model chose.
          That's what "autonomous" means here: the model's own output controls what happens next, not a
          programmer's fixed logic.
        </p>
      </div>

      <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-6">
        <AgentLoopDiagram />
        <p className="mt-4 max-w-xl text-center text-sm text-gray-600">
          The model perceives the conversation so far, decides whether to call a tool or answer, and if
          it calls a tool, the result becomes new state to perceive on the next pass. This repeats until
          the model decides it's done, and that becomes the final answer.
        </p>
      </div>
    </div>
  )
}
