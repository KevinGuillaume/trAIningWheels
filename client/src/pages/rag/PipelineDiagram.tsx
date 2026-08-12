import type { ReactNode } from 'react'

const ICONS: Record<string, ReactNode> = {
  chunking: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <rect x="2" y="7" width="16" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="7.5"
        y1="5.5"
        x2="7.5"
        y2="14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="1.6 1.6"
        strokeLinecap="round"
      />
      <line
        x1="12.5"
        y1="5.5"
        x2="12.5"
        y2="14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="1.6 1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  embedding: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <circle cx="5" cy="14" r="1.5" fill="currentColor" />
      <circle cx="14.5" cy="5.5" r="1.5" fill="currentColor" />
      <circle cx="13" cy="13.5" r="1.5" fill="currentColor" />
      <circle cx="6.5" cy="6" r="1.5" fill="currentColor" />
    </svg>
  ),
  retrieval: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="16.3" y1="16.3" x2="12.6" y2="12.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  prompt: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <rect x="3" y="2.5" width="14" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="6" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="13" x2="11" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  generation: (
    <svg viewBox="0 0 20 20" fill="currentColor" stroke="none" className="h-5 w-5">
      <path d="M10 2 L11.6 7.6 L17 9.2 L11.6 10.8 L10 16.4 L8.4 10.8 L3 9.2 L8.4 7.6 Z" />
    </svg>
  ),
  intro: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="9" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6.2" r="1" fill="currentColor" />
    </svg>
  ),
  tokenization: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <rect x="1.5" y="8" width="6" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8.5" y="8" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="8" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  context: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <rect x="1.5" y="6" width="17" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="7.5" width="9" height="5" rx="0.75" fill="currentColor" />
    </svg>
  ),
  tools: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8.2" y1="8.2" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="13.6" y="13.6" width="3.4" height="3.4" rx="0.8" fill="currentColor" transform="rotate(45 15.3 15.3)" />
    </svg>
  ),
}

function Arrow({ dim }: { dim: boolean }) {
  return (
    <svg viewBox="0 0 24 20" className={`h-4 w-5 shrink-0 ${dim ? 'text-gray-200' : 'text-gray-400'}`} fill="none">
      <line x1="1" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13 5 L19 10 L13 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface DiagramStage<T extends string> {
  id: T
  label: string
  available: boolean
}

// A group covers `span` consecutive stages, in stage order, starting right
// after the previous group ends. Spans across all groups must add up to
// stages.length.
interface DiagramGroup {
  label: string
  span: number
}

export default function PipelineDiagram<T extends string>({
  stages,
  groups = [],
  activeStage,
  onSelect,
}: {
  stages: readonly DiagramStage<T>[]
  groups?: readonly DiagramGroup[]
  activeStage: T
  onSelect: (id: T) => void
}) {
  const activeIndex = stages.findIndex((s) => s.id === activeStage)

  // Lay stages and arrows out on alternating grid columns (node, arrow, node, ...)
  // so a group's bracket can span the exact same columns as its stages, however
  // wide their labels end up being — no pixel math required.
  const columnCount = stages.length * 2 - 1

  const groupSpans = groups.reduce<{ label: string; startCol: number; endCol: number }[]>((acc, group) => {
    const startIdx = acc.length === 0 ? 0 : acc[acc.length - 1].endCol / 2 + 0.5
    const endIdx = startIdx + group.span - 1
    acc.push({ label: group.label, startCol: startIdx * 2 + 1, endCol: endIdx * 2 + 1 })
    return acc
  }, [])

  return (
    <div
      className="grid items-center gap-x-1 gap-y-2 overflow-x-auto pb-1"
      style={{ gridTemplateColumns: `repeat(${columnCount}, auto)` }}
    >
      {stages.map((stage, i) => {
        const isActive = i === activeIndex
        const isDone = i < activeIndex
        return (
          <div key={stage.id} className="contents">
            {i > 0 && (
              <div style={{ gridColumn: i * 2, gridRow: 1 }} className="flex justify-center">
                <Arrow dim={i > activeIndex} />
              </div>
            )}
            <button
              disabled={!stage.available}
              onClick={() => onSelect(stage.id)}
              style={{ gridColumn: i * 2 + 1, gridRow: 1 }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-center transition-all duration-150 ${
                !stage.available
                  ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                  : isActive
                    ? 'scale-105 border-gray-900 bg-gray-900 text-white shadow-md'
                    : isDone
                      ? 'border-gray-300 bg-gray-100 text-gray-500 hover:border-gray-400 hover:bg-gray-200'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              {ICONS[stage.id]}
              <span className="text-xs font-medium whitespace-nowrap">{stage.label}</span>
              {!stage.available && <span className="text-[10px] uppercase tracking-wide text-gray-300">soon</span>}
            </button>
          </div>
        )
      })}
      {groupSpans.map((group) => (
        <div
          key={group.label}
          style={{ gridColumn: `${group.startCol} / ${group.endCol + 1}`, gridRow: 2 }}
          className="flex flex-col items-center gap-1 pt-1"
        >
          <div className="h-px w-full bg-gray-300" />
          <span className="text-[11px] font-medium tracking-wide whitespace-nowrap text-gray-400 uppercase">
            {group.label}
          </span>
        </div>
      ))}
    </div>
  )
}
