import { corpus } from '../data/corpus'
import { chunkDocument, DEFAULT_MAX_CHARS, type Chunk } from './chunking'

export interface EmbeddableChunk extends Chunk {
  docId: string
  docTitle: string
  docIndex: number
}

export function buildEmbeddableChunks(): EmbeddableChunk[] {
  return corpus.flatMap((doc, docIndex) =>
    // chunkDocument's ids ("c0", "c1", ...) are only unique within one document —
    // prefix with docId so they stay unique once every document is flattened together.
    chunkDocument(doc.text, DEFAULT_MAX_CHARS).map((chunk) => ({
      ...chunk,
      id: `${doc.id}-${chunk.id}`,
      docId: doc.id,
      docTitle: doc.title,
      docIndex,
    })),
  )
}
