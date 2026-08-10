import { AutoTokenizer, env, type PreTrainedTokenizer } from '@huggingface/transformers'

// Using Hugging Face hub over the network and is cached by the browser after that.
env.allowLocalModels = false

interface TokenizeRequest {
  type: 'tokenize'
  id: number
  text: string
}

export interface WorkerToken {
  text: string
  id: number
}

let tokenizerPromise: Promise<PreTrainedTokenizer> | null = null

function loadTokenizer(id: number) {
  if (!tokenizerPromise) {
    // Same tokenizer the Generation stage's model uses, only the tokenizer
    // files are fetched here (a few MB), not the ~300MB model weights.
    tokenizerPromise = AutoTokenizer.from_pretrained('onnx-community/Qwen2.5-0.5B-Instruct', {
      progress_callback: (data: { status: string; progress?: number }) => {
        if (typeof data.progress === 'number') {
          postMessage({ type: 'progress', id, progress: data.progress })
        }
      },
    })
  }
  return tokenizerPromise
}

// This BPE tokenizer marks a leading space with 'Ġ' and a newline with 'Ċ'.
// Turn the space marker into a real leading space (visible via white-space:
// pre in the UI) and the newline marker into a visible glyph rather than a
// literal '\n', which would break a chip out of its single-line layout.
function cleanTokenText(raw: string): string {
  return raw.replace(/Ġ/g, ' ').replace(/Ċ/g, '↵')
}

addEventListener('message', async (event: MessageEvent<TokenizeRequest>) => {
  const { id, text } = event.data
  try {
    const tokenizer = await loadTokenizer(id)
    postMessage({ type: 'status', id, status: 'tokenizing' })

    const rawTokens = tokenizer.tokenize(text)
    const ids = tokenizer.convert_tokens_to_ids(rawTokens)
    const tokens: WorkerToken[] = rawTokens.map((t, i) => ({ text: cleanTokenText(t), id: ids[i] }))

    postMessage({ type: 'result', id, tokens })
  } catch (err) {
    postMessage({ type: 'error', id, message: err instanceof Error ? err.message : String(err) })
  }
})
