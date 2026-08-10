import { useCallback, useRef, useState } from 'react'
import type { WorkerToken } from '../workers/tokenizerWorker'

export type TokenizeStatus = 'idle' | 'loading-model' | 'tokenizing' | 'ready' | 'error'

interface WorkerMessage {
  type: 'progress' | 'status' | 'result' | 'error'
  id: number
  progress?: number
  status?: string
  tokens?: WorkerToken[]
  message?: string
}

export function useTokenizer() {
  const [status, setStatus] = useState<TokenizeStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)

  const tokenize = useCallback((text: string) => {
    return new Promise<WorkerToken[]>((resolve, reject) => {
      if (!workerRef.current) {
        workerRef.current = new Worker(new URL('../workers/tokenizerWorker.ts', import.meta.url), {
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
        } else if (data.type === 'status' && data.status === 'tokenizing') {
          setStatus('tokenizing')
        } else if (data.type === 'result') {
          setStatus('ready')
          setProgress(100)
          worker.removeEventListener('message', handleMessage)
          resolve(data.tokens ?? [])
        } else if (data.type === 'error') {
          setStatus('error')
          setError(data.message ?? 'Unknown error')
          worker.removeEventListener('message', handleMessage)
          reject(new Error(data.message))
        }
      }

      worker.addEventListener('message', handleMessage)
      worker.postMessage({ type: 'tokenize', id, text })
    })
  }, [])

  return { tokenize, status, progress, error }
}
