/** Shared across stages so Embedding operates on the same chunk granularity Chunking defaults to. */
export const DEFAULT_MAX_CHARS = 300

export interface Chunk {
  id: string
  text: string
  start: number
  end: number
  /** True when this chunk is a forced slice out of a paragraph longer than maxChars — the mid-sentence-cut failure mode. */
  hardSplit: boolean
  paragraphCount: number
}

interface Paragraph {
  text: string
  start: number
  end: number
}
/**
 * Function used to split up long text into separate paragraphs.
 * @param text long string that we are trying to split up into paragraphs
 * @returns Array of type Paragraphs
 */
function splitParagraphs(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const separator = /\n\s*\n/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  const pushParagraph = (raw: string, rawStart: number) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    const start = rawStart + raw.indexOf(trimmed)
    paragraphs.push({ text: trimmed, start, end: start + trimmed.length })
  }

  while ((match = separator.exec(text))) {
    pushParagraph(text.slice(lastIndex, match.index), lastIndex)
    lastIndex = separator.lastIndex
  }
  pushParagraph(text.slice(lastIndex), lastIndex)

  return paragraphs
}

/**
 * Greedily packs paragraphs into chunks up to maxChars. A paragraph longer than
 * maxChars on its own gets hard-split at the character boundary, which is what
 * lets the size control demonstrate the mid-sentence-cut tradeoff directly.
 */
export function chunkDocument(text: string, maxChars: number): Chunk[] {
  const paragraphs = splitParagraphs(text)
  const chunks: Chunk[] = []

  let current: { text: string; start: number; end: number; paragraphCount: number } | null = null

  const flush = () => {
    if (!current) return
    chunks.push({ id: `c${chunks.length}`, hardSplit: false, ...current })
    current = null
  }

  for (const paragraph of paragraphs) {
    if (paragraph.text.length > maxChars) {
      flush()
      for (let i = 0; i < paragraph.text.length; i += maxChars) {
        const slice = paragraph.text.slice(i, i + maxChars)
        chunks.push({
          id: `c${chunks.length}`,
          text: slice,
          start: paragraph.start + i,
          end: paragraph.start + i + slice.length,
          hardSplit: true,
          paragraphCount: 1,
        })
      }
      continue
    }

    if (!current) {
      current = { text: paragraph.text, start: paragraph.start, end: paragraph.end, paragraphCount: 1 }
      continue
    }

    const merged: string = `${current.text}\n\n${paragraph.text}`
    if (merged.length <= maxChars) {
      current = { text: merged, start: current.start, end: paragraph.end, paragraphCount: current.paragraphCount + 1 }
    } else {
      flush()
      current = { text: paragraph.text, start: paragraph.start, end: paragraph.end, paragraphCount: 1 }
    }
  }
  flush()

  return chunks
}
