import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Rag from './pages/Rag.tsx'

function App() {
  return (
    <div className="relative min-h-screen">
      {/* Shared ambient backdrop, fixed to the viewport so it stays consistent
          across every page regardless of how tall the page's content is. */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 18% 15%, rgba(37,99,235,.10), transparent 42%), radial-gradient(circle at 85% 78%, rgba(37,99,235,.08), transparent 45%), #ffffff',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage: 'radial-gradient(#e4e2dc 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 40%, transparent 85%)',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 40%, transparent 85%)',
        }}
      />

      <header className="flex items-center gap-8 border-b border-[#eceae5] px-10 py-[22px]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[19px] font-bold tracking-[-0.01em] text-[#14161a]">
            Tr<span className="text-[#2563eb]">ai</span>ning Wheels
          </span>
          <span className="text-xs font-medium text-[#9a9da5]">AI Learning Made Simple</span>
        </div>
        <nav className="flex gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-[7px] px-4 py-2 text-sm font-semibold ${
                isActive ? 'bg-[#14161a] text-white' : 'text-[#5b5f68] hover:bg-[#f2f1ed] hover:text-[#14161a]'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/rag"
            end
            className={({ isActive }) =>
              `rounded-[7px] px-4 py-2 text-sm font-semibold ${
                isActive ? 'bg-[#14161a] text-white' : 'text-[#5b5f68] hover:bg-[#f2f1ed] hover:text-[#14161a]'
              }`
            }
          >
            RAG
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rag" element={<Rag />} />
      </Routes>
    </div>
  )
}

export default App
