import { useState } from 'react'
import Marquee from './components/Marquee'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import MainDownloader from './pages/MainDownloader'
import InstagramAltPage from './pages/InstagramAltPage'

export default function App() {
  const [activePage, setActivePage] = useState('main')

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Marquee />
      <div className="flex w-full flex-1">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="flex flex-1 justify-center px-3 py-8 sm:px-6 sm:py-12">
          {activePage === 'instagram-alt' ? <InstagramAltPage /> : <MainDownloader />}
        </main>
      </div>
      <Footer />
    </div>
  )
}
