import type { RankedChunk } from './retrieval'

export interface PromptAssemblyOptions {
  strictGrounding: boolean
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
}

export const STRICT_INSTRUCTION =
  'Answer the question using only the context below. If the context does not contain the answer, say "I don\'t know" — do not use outside knowledge.'

export const LOOSE_INSTRUCTION =
  'Answer the question using the context below as your primary source. If it\'s incomplete, you may fill gaps with your own knowledge.'

export function instructionFor(options: PromptAssemblyOptions): string {
  return options.strictGrounding ? STRICT_INSTRUCTION : LOOSE_INSTRUCTION
}

export function contextBlock(matches: RankedChunk[]): string {
  return matches.map((m, i) => `[${i + 1}] (${m.chunk.docTitle})\n${m.chunk.text}`).join('\n\n')
}

/** The single flat string view shown in the Prompt assembly stage. */
export function assemblePrompt(queryText: string, matches: RankedChunk[], options: PromptAssemblyOptions): string {
  return `${instructionFor(options)}\n\nContext:\n${contextBlock(matches)}\n\nQuestion: ${queryText}`
}

/** The same prompt, split into chat roles — what actually gets sent to the generator. */
export function assembleGroundedMessages(
  queryText: string,
  matches: RankedChunk[],
  options: PromptAssemblyOptions,
): ChatMessage[] {
  return [
    { role: 'system', content: instructionFor(options) },
    { role: 'user', content: `Context:\n${contextBlock(matches)}\n\nQuestion: ${queryText}` },
  ]
}

/** No retrieved context at all — the baseline for showing what RAG actually buys you. */
export function assembleUngroundedMessages(queryText: string): ChatMessage[] {
  return [
    { role: 'system', content: 'Answer the question as best you can, based only on what you already know.' },
    { role: 'user', content: queryText },
  ]
}
