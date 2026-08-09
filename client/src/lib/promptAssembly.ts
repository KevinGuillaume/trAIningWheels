import type { RankedChunk } from './retrieval'

export interface PromptAssemblyOptions {
  strictGrounding: boolean
}

const STRICT_INSTRUCTION =
  'Answer the question using only the context below. If the context does not contain the answer, say "I don\'t know" — do not use outside knowledge.'

const LOOSE_INSTRUCTION =
  'Answer the question using the context below as your primary source. If it\'s incomplete, you may fill gaps with your own knowledge.'

export function assemblePrompt(queryText: string, matches: RankedChunk[], options: PromptAssemblyOptions): string {
  const instruction = options.strictGrounding ? STRICT_INSTRUCTION : LOOSE_INSTRUCTION
  const context = matches.map((m, i) => `[${i + 1}] (${m.chunk.docTitle})\n${m.chunk.text}`).join('\n\n')
  return `${instruction}\n\nContext:\n${context}\n\nQuestion: ${queryText}`
}
