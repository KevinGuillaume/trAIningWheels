import { corpus } from '../data/corpus'

export interface ToolSchema {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, { type: string; description?: string }>
      required?: string[]
    }
  }
}

// A small recursive-descent parser for +, -, *, /, and parentheses. No
// eval() or Function(): the expression comes from model output, so it gets
// evaluated with real arithmetic instead of running as code.
function evaluateArithmetic(expression: string): number {
  const s = expression.replace(/\s+/g, '')
  if (!/^[0-9+\-*/().]*$/.test(s)) {
    throw new Error('Expression can only contain numbers, +, -, *, /, and parentheses.')
  }
  let i = 0

  function peek(): string | undefined {
    return s[i]
  }

  function parseNumber(): number {
    const start = i
    while (i < s.length && /[0-9.]/.test(s[i])) i++
    if (i === start) throw new Error(`Expected a number at position ${start}.`)
    const value = Number(s.slice(start, i))
    if (Number.isNaN(value)) throw new Error(`Invalid number at position ${start}.`)
    return value
  }

  function parseFactor(): number {
    if (peek() === '(') {
      i++
      const value = parseExpr()
      if (peek() !== ')') throw new Error('Missing closing parenthesis.')
      i++
      return value
    }
    if (peek() === '-') {
      i++
      return -parseFactor()
    }
    return parseNumber()
  }

  function parseTerm(): number {
    let value = parseFactor()
    while (peek() === '*' || peek() === '/') {
      const op = peek()
      i++
      const rhs = parseFactor()
      value = op === '*' ? value * rhs : value / rhs
    }
    return value
  }

  function parseExpr(): number {
    let value = parseTerm()
    while (peek() === '+' || peek() === '-') {
      const op = peek()
      i++
      const rhs = parseTerm()
      value = op === '+' ? value + rhs : value - rhs
    }
    return value
  }

  if (s.length === 0) throw new Error('Empty expression.')
  const result = parseExpr()
  if (i !== s.length) throw new Error(`Unexpected character at position ${i}.`)
  return result
}

function searchCorpus(query: string): string {
  const queryTerms = query.toLowerCase().match(/[a-z0-9]+/g) ?? []
  if (queryTerms.length === 0) return 'No search terms provided.'

  let best: { doc: (typeof corpus)[number]; score: number } | null = null
  for (const doc of corpus) {
    const haystack = `${doc.title} ${doc.text}`.toLowerCase()
    const score = queryTerms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0)
    if (score > 0 && (!best || score > best.score)) {
      best = { doc, score }
    }
  }

  return best ? `${best.doc.title}: ${best.doc.text}` : 'No matching document found.'
}

export const CALCULATOR_TOOL: ToolSchema = {
  type: 'function',
  function: {
    name: 'calculator',
    description:
      'Evaluate a basic arithmetic expression using +, -, *, /, and parentheses. Use this for any math a person could not reliably do in their head.',
    parameters: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'A math expression, e.g. "847 * 39" or "(12 + 8) / 4"' },
      },
      required: ['expression'],
    },
  },
}

export const SEARCH_TOOL: ToolSchema = {
  type: 'function',
  function: {
    name: 'search_sports_facts',
    description:
      'Look up facts from a small corpus covering the 2026 Winter Olympics, Super Bowl LX, the 2026 NBA Finals, the 2026 World Cup, Wimbledon 2026, and the 2026 MLB season. Use this for questions about those events.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search for, e.g. "Super Bowl winner"' },
      },
      required: ['query'],
    },
  },
}

export const AGENT_TOOLS: ToolSchema[] = [CALCULATOR_TOOL, SEARCH_TOOL]

// Never throws: a model-generated tool call can have a missing or malformed
// argument, and that should show up as a tool result the model can react
// to, not a crash in the app.
export function executeTool(name: string, args: unknown): string {
  try {
    const parsedArgs = (typeof args === 'object' && args !== null ? args : {}) as Record<string, unknown>

    if (name === 'calculator') {
      const expression = parsedArgs.expression
      if (typeof expression !== 'string') throw new Error('Missing "expression" argument.')
      return String(evaluateArithmetic(expression))
    }

    if (name === 'search_sports_facts') {
      const query = parsedArgs.query
      if (typeof query !== 'string') throw new Error('Missing "query" argument.')
      return searchCorpus(query)
    }

    return `Error: unknown tool "${name}".`
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`
  }
}
