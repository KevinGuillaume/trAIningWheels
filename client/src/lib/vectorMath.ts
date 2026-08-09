export function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

export function norm(a: number[]): number {
  return Math.sqrt(dot(a, a))
}

/** Our embeddings are already L2-normalized (see embeddingWorker.ts), so this is effectively just a dot product — the division is a safety net, not the common case. */
export function cosineSimilarity(a: number[], b: number[]): number {
  const denom = norm(a) * norm(b)
  return denom === 0 ? 0 : dot(a, b) / denom
}
