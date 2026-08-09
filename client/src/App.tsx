import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.tsx'

function App() {
  return (
    <>
      <nav className="flex gap-2 border-b border-gray-200 px-8 py-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm ${
              isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          Home
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  )
}

export default App
