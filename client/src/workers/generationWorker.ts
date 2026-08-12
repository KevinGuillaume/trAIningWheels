import { pipeline, env, type TextGenerationPipeline } from '@huggingface/transformers'
import type { ToolSchema } from '../lib/agentTools'
import type { ChatMessage } from '../lib/promptAssembly'

env.allowLocalModels = false

interface GenerateRequest {
  type: 'generate'
  id: number
  messages: ChatMessage[]
  maxNewTokens: number
  tools?: ToolSchema[]
}

let generatorPromise: Promise<TextGenerationPipeline> | null = null

function loadGenerator(id: number) {
  if (!generatorPromise) {
    generatorPromise = pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
      dtype: 'q4',
      progress_callback: (data: { status: string; progress?: number }) => {
        if (typeof data.progress === 'number') {
          postMessage({ type: 'progress', id, progress: data.progress })
        }
      },
    })
  }
  return generatorPromise
}

addEventListener('message', async (event: MessageEvent<GenerateRequest>) => {
  const { id, messages, maxNewTokens, tools } = event.data
  try {
    const generator = await loadGenerator(id)
    postMessage({ type: 'status', id, status: 'generating' })

    const output = await generator(messages, { max_new_tokens: maxNewTokens, do_sample: false, tools })
    const first = Array.isArray(output) ? output[0] : output
    const generatedText = first.generated_text
    const lastTurn = Array.isArray(generatedText) ? generatedText.at(-1) : null
    const text = lastTurn ? lastTurn.content : generatedText
    const answer = typeof text === 'string' ? text : JSON.stringify(text)

    postMessage({ type: 'result', id, text: answer.trim() })
  } catch (err) {
    postMessage({ type: 'error', id, message: err instanceof Error ? err.message : String(err) })
  }
})
