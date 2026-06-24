import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Marketplace from './pages/Marketplace'
import Shop from './pages/Shop'
import Live from './pages/Live'
import Community from './pages/Community'
import Raffles from './pages/Raffles'
import Messages from './pages/Messages'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/live" element={<Live />} />
          <Route path="/community" element={<Community />} />
          <Route path="/raffles" element={<Raffles />} />
          <Route path="/messages" element={<Messages />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
