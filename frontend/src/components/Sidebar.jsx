import { useState } from 'react'
import { Camera, Download, Menu, X as XIcon } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'main', label: 'Principal', Icon: Download },
  { id: 'instagram-alt', label: 'Instagram Alt', Icon: Camera },
]

function NavButton({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 border-[3px] border-black px-3 py-2 text-left text-xs font-black uppercase transition-all ${
        active ? 'bg-yellow-300 shadow-[3px_3px_0_0_#000]' : 'bg-white hover:bg-gray-100'
      }`}
    >
      <item.Icon className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      {item.label}
    </button>
  )
}

export default function Sidebar({ activePage, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleNavigate(id) {
    onNavigate(id)
    setMobileOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className="fixed left-3 top-[4.25rem] z-40 flex h-10 w-10 items-center justify-center border-[3px] border-black bg-yellow-300 shadow-[3px_3px_0_0_#000] sm:hidden"
      >
        <Menu className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div className="flex w-64 flex-col gap-2 border-r-[3px] border-black bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-black/50">Menú</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
                <XIcon className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
              </button>
            </div>
            {NAV_ITEMS.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={activePage === item.id}
                onClick={() => handleNavigate(item.id)}
              />
            ))}
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      <aside className="hidden shrink-0 flex-col gap-2 border-r-[3px] border-black bg-white p-4 sm:flex sm:w-56">
        <span className="mb-2 text-xs font-black uppercase text-black/50">Menú</span>
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activePage === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </aside>
    </>
  )
}
