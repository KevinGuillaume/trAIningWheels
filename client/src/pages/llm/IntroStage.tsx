import { useRef, useState } from 'react'
import type { ChatMessage } from '../../lib/promptAssembly'
import { useGeneration } from '../../lib/useGeneration'

const STARTER_PROMPTS = [
  'The capital of France is',
  'Once upon a time, in a small village,',
  'The three primary colors are',
]

// Bounds how many generate() calls one play-through makes, keeping a run on
// CPU from running away while still landing on a full sentence or two.
const MAX_TOKENS = 24

export default function IntroStage() {
  const { generate, status, progress, error } = useGeneration()
  const [promptText, setPromptText] = useState(STARTER_PROMPTS[0])
  const [revealedText, setRevealedText] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const stopRef = useRef(false)

  const handlePlay = async () => {
    const prompt = promptText.trim()
    if (!prompt || isPlaying) return

    setIsPlaying(true)
    setRevealedText('')
    stopRef.current = false
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }]

    // Re-runs generation from scratch with one more token each step. Since
    // decoding is greedy (do_sample: false), the output for n tokens is
    // always a prefix of the output for n+1, so this reliably animates a
    // "one token at a time" reveal without needing incremental decoding
    // support from the pipeline.
    let previous = ''
    for (let n = 1; n <= MAX_TOKENS; n++) {
      if (stopRef.current) break
      try {
        const text = await generate(messages, n)
        setHasLoadedOnce(true)
        if (text === previous) break
        previous = text
        setRevealedText(text)
      } catch {
        break
      }
    }
    setIsPlaying(false)
  }

  const handleStop = () => {
    stopRef.current = true
    setIsPlaying(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">What is an LLM?</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          A large language model is a neural network, often billions of numbers called parameters,
          trained on huge amounts of text (books, articles, code, web pages) until it learns the
          statistical patterns of language well enough to boil down to one skill: given all the text so
          far, predict what piece of text is likely to come next.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Generating a reply is just that one skill applied over and over: predict the next piece,
          append it, and feed the longer text back in as the new "so far." Below, a real small model
          (Qwen2.5-0.5B-Instruct, about 500 million trained parameters, running entirely in your
          browser) does exactly that. Each step you see is a separate prediction, one piece at a time.
        </p>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        ⚠ Heads up, first run downloads the ~300MB generation model. This can take a while depending on
        your connection. It's cached after that.
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-xs font-medium text-gray-500">Starting prompt</div>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          disabled={isPlaying}
          rows={2}
          className="mt-1 w-full resize-none rounded-md border border-gray-200 p-2 text-sm text-gray-800 focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => setPromptText(p)}
              disabled={isPlaying}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={isPlaying ? handleStop : handlePlay}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {isPlaying ? 'Stop' : 'Generate, one piece at a time'}
          </button>
        </div>

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
        {status === 'error' && error && <div className="mt-3 text-sm text-red-700">Something went wrong: {error}</div>}

        {(revealedText || isPlaying) && (
          <div className="mt-4 rounded-md border border-gray-100 bg-gray-50 p-3">
            <p className="text-sm whitespace-pre-wrap text-gray-800">
              <span className="text-gray-400">{promptText.trim()} </span>
              {revealedText}
              {isPlaying && <span className="animate-pulse text-gray-400">▍</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
