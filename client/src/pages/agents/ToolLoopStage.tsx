import { useState } from 'react'
import { AGENT_TOOLS, executeTool } from '../../lib/agentTools'
import type { ChatMessage } from '../../lib/promptAssembly'
import { useGeneration } from '../../lib/useGeneration'

const SUGGESTIONS = ['What is 847 times 39?', 'Who won the Super Bowl in 2026?', 'Say hello in French.']

const SYSTEM_PROMPT =
  'You are a helpful assistant with access to tools. Use a tool whenever it would make your answer more accurate than guessing, and answer directly when no tool is needed.'

// Bounds how many generate() calls one run makes: question, maybe a tool
// call, maybe another, then a final answer. Keeps a run on CPU from running
// away if the model keeps calling tools.
const MAX_ITERATIONS = 3
const MAX_NEW_TOKENS = 200

type Step =
  | { kind: 'user'; text: string }
  | { kind: 'model'; text: string; final: boolean }
  | { kind: 'tool-call'; name: string; args: string }
  | { kind: 'tool-result'; result: string }
  | { kind: 'error'; text: string }

function parseToolCall(raw: string): { name: string; arguments: unknown } | null {
  const match = raw.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/)
  if (!match) return null
  const parsed = JSON.parse(match[1])
  if (!parsed || typeof parsed.name !== 'string') throw new Error('Tool call was missing a "name".')
  return parsed
}

export default function ToolLoopStage() {
  const { generate, status, progress, error: generationError } = useGeneration()
  const [questionText, setQuestionText] = useState(SUGGESTIONS[0])
  const [steps, setSteps] = useState<Step[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const runAgent = async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || isRunning) return

    setIsRunning(true)
    setSteps([{ kind: 'user', text: trimmed }])

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: trimmed },
    ]

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      let raw: string
      try {
        raw = await generate(messages, MAX_NEW_TOKENS, AGENT_TOOLS)
        setHasLoadedOnce(true)
      } catch {
        setSteps((s) => [...s, { kind: 'error', text: 'Something went wrong generating a response.' }])
        break
      }

      let toolCall: { name: string; arguments: unknown } | null = null
      try {
        toolCall = parseToolCall(raw)
      } catch {
        setSteps((s) => [
          ...s,
          { kind: 'model', text: raw, final: false },
          {
            kind: 'error',
            text: "The model's tool call couldn't be parsed. That's a known limitation of a small model, stopping here.",
          },
        ])
        break
      }

      if (!toolCall) {
        setSteps((s) => [...s, { kind: 'model', text: raw, final: true }])
        break
      }

      messages.push({ role: 'assistant', content: raw })
      setSteps((s) => [
        ...s,
        { kind: 'model', text: raw, final: false },
        { kind: 'tool-call', name: toolCall!.name, args: JSON.stringify(toolCall!.arguments ?? {}) },
      ])

      const result = executeTool(toolCall.name, toolCall.arguments)
      messages.push({ role: 'tool', content: result })
      setSteps((s) => [...s, { kind: 'tool-result', result }])

      if (iter === MAX_ITERATIONS - 1) {
        setSteps((s) => [...s, { kind: 'error', text: 'Reached the step limit for this demo before a final answer.' }])
      }
    }

    setIsRunning(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Watch it run</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Ask a question below and watch the loop from the last stage actually happen. The model
          perceives your question, decides whether it needs help, and if so, which of two tools fits: a
          calculator, or a keyword search over a small sports corpus. Watch for the moment that actually
          makes this agentic: the tool call below isn't just text the model wrote, it gets sent off and
          really executed, and the real result is what comes back.
        </p>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        Heads up: this uses the same small model (Qwen2.5-0.5B-Instruct, about 500 million parameters)
        as the rest of this app. At this size, tool calling is not perfectly reliable. If it produces a
        malformed tool call or picks the wrong tool, that is expected. Real agent systems typically lean
        on much larger models for this exact reason.
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-xs font-medium text-gray-500">Ask something</div>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          disabled={isRunning}
          rows={2}
          className="mt-1 w-full resize-none rounded-md border border-gray-200 p-2 text-sm text-gray-800 focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQuestionText(s)}
              disabled={isRunning}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => runAgent(questionText)}
          disabled={isRunning || !questionText.trim()}
          className="mt-3 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRunning ? 'Running…' : 'Run the agent'}
        </button>

        {status === 'loading-model' && !hasLoadedOnce && (
          <div className="mt-3">
            <div className="text-xs text-gray-500">Downloading generation model weights…</div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gray-900 transition-all"
                style={{ width: `${Math.max(4, progress)}%` }}
              />
            </div>
          </div>
        )}
        {status === 'error' && generationError && (
          <div className="mt-3 text-sm text-red-700">Something went wrong: {generationError}</div>
        )}

        {steps.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {steps.map((step, i) => {
              if (step.kind === 'user') {
                return (
                  <div key={i} className="rounded-md border border-gray-200 bg-white p-3 text-sm">
                    <span className="font-medium text-gray-500">You asked: </span>
                    <span className="text-gray-800">{step.text}</span>
                  </div>
                )
              }
              if (step.kind === 'model') {
                return (
                  <div
                    key={i}
                    className={`rounded-md border p-3 ${
                      step.final ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-500">
                      {step.final ? 'Final answer' : "Model's raw output"}
                    </div>
                    <p className="mt-1 font-mono text-xs whitespace-pre-wrap text-gray-800">{step.text}</p>
                  </div>
                )
              }
              if (step.kind === 'tool-call') {
                return (
                  <div key={i} className="rounded-md border border-blue-100 bg-blue-50 p-3 text-xs">
                    <span className="font-medium text-blue-800">Harness calls tool: </span>
                    <span className="font-mono text-blue-900">
                      {step.name}({step.args})
                    </span>
                  </div>
                )
              }
              if (step.kind === 'tool-result') {
                return (
                  <div key={i} className="rounded-md border border-green-100 bg-green-50 p-3 text-xs">
                    <span className="font-medium text-green-800">Tool result: </span>
                    <span className="font-mono text-green-900">{step.result}</span>
                  </div>
                )
              }
              return (
                <div key={i} className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {step.text}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
