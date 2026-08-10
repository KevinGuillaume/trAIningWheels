import { Link } from 'react-router-dom'

const NETWORK_PATH = 'M20 30L90 15M90 15L60 80M60 80L20 30M60 80L150 55M60 80L20 120'
const NETWORK_PATH_MIRRORED = 'M20 30L90 15M90 15L60 80M60 80L20 30M60 80L150 100M60 80L20 120'

const CONCEPTS = [
  { label: 'Model Context Protocol' },
  { label: 'Agents & Tool Use' },
]

function NetworkDecoration({ path, cy4 }: { path: string; cy4: number }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="pointer-events-none w-full opacity-50">
      <circle cx={20} cy={30} r={4} fill="#c7d2fe" />
      <circle cx={90} cy={15} r={4} fill="#c7d2fe" />
      <circle cx={60} cy={80} r={4} fill="#c7d2fe" />
      <circle cx={150} cy={cy4} r={4} fill="#c7d2fe" />
      <circle cx={20} cy={120} r={4} fill="#c7d2fe" />
      <path d={path} stroke="#dde3fa" strokeWidth={1.5} />
    </svg>
  )
}

function FloatingDot({
  size,
  top,
  left,
  right,
  opacity,
  duration,
  delay,
}: {
  size: number
  top: string
  left?: string
  right?: string
  opacity: number
  duration: string
  delay?: string
}) {
  return (
    <div
      className="pointer-events-none absolute rounded-full bg-[#2563eb]"
      style={{
        top,
        left,
        right,
        width: size,
        height: size,
        opacity,
        animation: `tw-float ${duration} ease-in-out infinite ${delay ?? ''}`,
      }}
    />
  )
}

export default function Home() {
  return (
    <div className="relative flex min-h-[calc(100vh-81px)] flex-col overflow-hidden">
      <div className="absolute top-[60px] -left-10 w-[340px]">
        <NetworkDecoration path={NETWORK_PATH} cy4={55} />
      </div>
      <div className="absolute -right-8 bottom-10 w-[300px] -scale-x-100">
        <NetworkDecoration path={NETWORK_PATH_MIRRORED} cy4={100} />
      </div>

      <FloatingDot size={10} top="22%" left="9%" opacity={0.35} duration="7s" />
      <FloatingDot size={6} top="65%" left="14%" opacity={0.3} duration="5.5s" delay="0.8s" />
      <FloatingDot size={8} top="30%" right="11%" opacity={0.3} duration="6.5s" delay="1.4s" />
      <FloatingDot size={5} top="70%" right="16%" opacity={0.35} duration="5s" delay="0.4s" />

      <main className="relative z-[1] flex flex-1 flex-col items-center justify-center px-6 pt-20 pb-25 text-center">
        <h1 className="mb-5 max-w-[720px] text-[44px] leading-[1.15] font-bold tracking-[-0.02em] text-[#14161a]">
          Learn AI concepts by building them
        </h1>
        <p className="mb-9 max-w-[600px] text-[17px] leading-[1.6] text-[#6b6f78]">
          A hands-on space for seeing how AI systems actually work — each concept gets its own
          interactive walkthrough with real visualizations and working examples, not just diagrams in
          a slide deck.
        </p>
        <Link
          to="/llm-basics"
          className="inline-flex items-center gap-1.5 border-b border-[#14161a] pb-0.5 text-[15px] font-semibold text-[#14161a] hover:border-[#2563eb] hover:text-[#2563eb]"
        >
          Start with LLM Basics <span aria-hidden="true">→</span>
        </Link>
        <Link
          to="/rag"
          className="mt-3 text-sm font-medium text-[#9a9da5] hover:text-[#5b5f68]"
        >
          Already know the basics? Jump to RAG →
        </Link>

        <div className="mt-[88px] flex flex-col items-center gap-[18px]">
          <div className="text-xs font-semibold tracking-[.08em] text-[#9a9da5] uppercase">
            More concepts, on the way
          </div>
          <div className="flex flex-wrap justify-center gap-3.5">
            {CONCEPTS.map((concept) => (
              <div
                key={concept.label}
                className="flex items-center gap-2.5 rounded-[9px] border border-dashed border-[#dcdad4] bg-[#fbfaf8] px-5 py-[13px] text-sm font-semibold text-[#9a9da5]"
              >
                {concept.label}
                <span className="rounded-full bg-[#f2f1ed] px-2 py-[3px] text-[11px] font-semibold text-[#b3b0a8]">
                  Soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
