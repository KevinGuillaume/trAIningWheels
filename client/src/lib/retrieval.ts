import type { EmbeddableChunk } from './embeddableChunks'
import type { PCAFit, Point2D } from './pca'
import { cosineSimilarity } from './vectorMath'

export interface RankedChunk {
  chunk: EmbeddableChunk
  score: number
}

export interface SearchResult {
  queryText: string
  queryPoint: Point2D
  ranked: RankedChunk[]
}

export async function runRetrieval(
  queryText: string,
  chunks: EmbeddableChunk[],
  vectors: number[][],
  pcaFit: PCAFit,
  embed: (texts: string[]) => Promise<number[][]>,
): Promise<SearchResult> {
  const [queryVector] = await embed([queryText])
  const queryPoint = pcaFit.project(queryVector)
  const ranked = chunks
    .map((chunk, i) => ({ chunk, score: cosineSimilarity(queryVector, vectors[i]) }))
    .sort((a, b) => b.score - a.score)
  return { queryText, queryPoint, ranked }
}
