import { dot } from './vectorMath'

export interface Point2D {
  x: number
  y: number
}

export interface PCAFit {
  points: Point2D[]
  /** Projects a new (unseen) vector onto the same axes fit from the corpus — used to place a query in the same embedding space. */
  project: (vector: number[]) => Point2D
}

function normalize(v: number[]) {
  const n = Math.sqrt(dot(v, v)) || 1
  for (let i = 0; i < v.length; i++) v[i] /= n
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

/** X^T u / s recovers the unit principal axis in the original d-dim space from the n-dim Gram eigenvector. */
function axisFromEigenvector(centered: number[][], u: number[], s: number, d: number): number[] {
  const axis = new Array(d).fill(0)
  for (let i = 0; i < centered.length; i++) {
    for (let k = 0; k < d; k++) axis[k] += u[i] * centered[i][k]
  }
  const scale = s || 1
  for (let k = 0; k < d; k++) axis[k] /= scale
  return axis
}

/**
 * Fits a 2-component PCA on high-dimensional vectors and returns both their
 * projected coordinates and a `project` function for placing new vectors
 * (e.g. a query) onto those same axes.
 *
 * Uses the "dual" formulation: eigendecomposes the small n x n Gram matrix
 * (X X^T) instead of the huge d x d covariance matrix, since we have far more
 * dimensions (384) than points (a couple dozen chunks).
 */
export function fitPCA2D(vectors: number[][]): PCAFit {
  const n = vectors.length
  if (n === 0) return { points: [], project: () => ({ x: 0, y: 0 }) }
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

  const axis1 = axisFromEigenvector(centered, first.vector, s1, d)
  const axis2 = axisFromEigenvector(centered, second.vector, s2, d)

  const points = first.vector.map((_, i) => ({ x: first.vector[i] * s1, y: second.vector[i] * s2 }))

  const project = (vector: number[]): Point2D => {
    const c = vector.map((val, k) => val - mean[k])
    return { x: dot(c, axis1), y: dot(c, axis2) }
  }

  return { points, project }
}
