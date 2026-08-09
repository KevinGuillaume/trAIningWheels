import { pipeline, env, type FeatureExtractionPipeline } from '@huggingface/transformers'

// Using Hugging Face hub over the network and is cached by the browser after that.
env.allowLocalModels = false

interface EmbedRequest {
  type: 'embed'
  id: number
  texts: string[]
}

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null

function loadExtractor(id: number) {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      progress_callback: (data: { status: string; progress?: number }) => {
        if (typeof data.progress === 'number') {
          postMessage({ type: 'progress', id, progress: data.progress })
        }
      },
    })
  }
  return extractorPromise
}

addEventListener('message', async (event: MessageEvent<EmbedRequest>) => {
  const { id, texts } = event.data
  try {
    const extractor = await loadExtractor(id)
    postMessage({ type: 'status', id, status: 'embedding' })

    const vectors: number[][] = []
    for (const text of texts) {
      const output = await extractor(text, { pooling: 'mean', normalize: true })
      vectors.push(Array.from(output.data as Float32Array))
    }

    postMessage({ type: 'result', id, vectors })
  } catch (err) {
    postMessage({ type: 'error', id, message: err instanceof Error ? err.message : String(err) })
  }
})
