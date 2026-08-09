export interface Point2D {
  x: number
  y: number
}

function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

function normalize(v: number[]) {
  const norm = Math.sqrt(dot(v, v)) || 1
  for (let i = 0; i < v.length; i++) v[i] /= norm
}

function multiply(matrix: number[][], v: number[]): number[] {
  return matrix.map((row) => dot(row, v))
}

/** Power iteration for the dominant eigenpair of a small symmetric matrix. */
function topEigenpair(matrix: number[][], size: number, iterations = 200): { value: number; vector: number[] } {
  let v = Array.from({ length: size }, () => Math.random())
  normalize(v)
  for (let i = 0; i < iterations; i++) {
    const next = multiply(matrix, v)
    normalize(next)
    v = next
  }
  const value = dot(v, multiply(matrix, v))
  return { value, vector: v }
}

/** Subtracts the rank-1 component of an eigenpair out of a matrix (deflation). */
function deflate(matrix: number[][], value: number, vector: number[], size: number): number[][] {
  const result: number[][] = Array.from({ length: size }, () => new Array(size).fill(0))
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result[i][j] = matrix[i][j] - value * vector[i] * vector[j]
    }
  }
  return result
}

/**
 * Projects high-dimensional vectors down to 2D via PCA.
 */
export function pca2D(vectors: number[][]): Point2D[] {
  const n = vectors.length
  if (n === 0) return []
  const d = vectors[0].length

  const mean = new Array(d).fill(0)
  for (const v of vectors) {
    for (let k = 0; k < d; k++) mean[k] += v[k] / n
  }
  const centered = vectors.map((v) => v.map((val, k) => val - mean[k]))

  const gram: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const value = dot(centered[i], centered[j])
      gram[i][j] = value
      gram[j][i] = value
    }
  }

  const first = topEigenpair(gram, n)
  const deflated = deflate(gram, first.value, first.vector, n)
  const second = topEigenpair(deflated, n)

  const s1 = Math.sqrt(Math.max(first.value, 0))
  const s2 = Math.sqrt(Math.max(second.value, 0))

  return first.vector.map((_, i) => ({ x: first.vector[i] * s1, y: second.vector[i] * s2 }))
}
