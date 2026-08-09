import { useCallback, useRef, useState } from 'react'

export type EmbedStatus = 'idle' | 'loading-model' | 'embedding' | 'ready' | 'error'

interface WorkerMessage {
  type: 'progress' | 'status' | 'result' | 'error'
  id: number
  progress?: number
  status?: string
  vectors?: number[][]
  message?: string
}

export function useEmbeddings() {
  const [status, setStatus] = useState<EmbedStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)

  const embed = useCallback((texts: string[]) => {
    return new Promise<number[][]>((resolve, reject) => {
      if (!workerRef.current) {
        workerRef.current = new Worker(new URL('../workers/embeddingWorker.ts', import.meta.url), {
          type: 'module',
        })
      }
      const worker = workerRef.current
      const id = ++requestId.current

      setStatus('loading-model')
      setProgress(0)
      setError(null)

      const handleMessage = (event: MessageEvent<WorkerMessage>) => {
        const data = event.data
        if (data.id !== id) return

        if (data.type === 'progress') {
          setProgress(data.progress ?? 0)
        } else if (data.type === 'status' && data.status === 'embedding') {
          setStatus('embedding')
        } else if (data.type === 'result') {
          setStatus('ready')
          setProgress(100)
          worker.removeEventListener('message', handleMessage)
          resolve(data.vectors ?? [])
        } else if (data.type === 'error') {
          setStatus('error')
          setError(data.message ?? 'Unknown error')
          worker.removeEventListener('message', handleMessage)
          reject(new Error(data.message))
        }
      }

      worker.addEventListener('message', handleMessage)
      worker.postMessage({ type: 'embed', id, texts })
    })
  }, [])

  return { embed, status, progress, error }
}
