import { useCallback, useRef, useState } from 'react'
import type { ToolSchema } from './agentTools'
import type { ChatMessage } from './promptAssembly'

export type GenerateStatus = 'idle' | 'loading-model' | 'generating' | 'ready' | 'error'

interface WorkerMessage {
  type: 'progress' | 'status' | 'result' | 'error'
  id: number
  progress?: number
  status?: string
  text?: string
  message?: string
}

export function useGeneration() {
  const [status, setStatus] = useState<GenerateStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)

  const generate = useCallback((messages: ChatMessage[], maxNewTokens = 120, tools?: ToolSchema[]) => {
    return new Promise<string>((resolve, reject) => {
      if (!workerRef.current) {
        workerRef.current = new Worker(new URL('../workers/generationWorker.ts', import.meta.url), {
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
        } else if (data.type === 'status' && data.status === 'generating') {
          setStatus('generating')
        } else if (data.type === 'result') {
          setStatus('ready')
          setProgress(100)
          worker.removeEventListener('message', handleMessage)
          resolve(data.text ?? '')
        } else if (data.type === 'error') {
          setStatus('error')
          setError(data.message ?? 'Unknown error')
          worker.removeEventListener('message', handleMessage)
          reject(new Error(data.message))
        }
      }

      worker.addEventListener('message', handleMessage)
      worker.postMessage({ type: 'generate', id, messages, maxNewTokens, tools })
    })
  }, [])

  return { generate, status, progress, error }
}
