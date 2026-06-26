import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AdminRoute } from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import ChatBot from './components/ChatBot'
import Landing from './pages/Landing'
import Marketplace from './pages/Marketplace'
import Live from './pages/Live'
import Community from './pages/Community'
import Raffles from './pages/Raffles'
import Messages from './pages/Messages'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import Wallet from './pages/Wallet'
import Aprende from './pages/Aprende'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#0a0a0a] text-white">
          <Navbar />
          <Routes>
            <Route path="/"            element={<Landing />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/shop"        element={<Navigate to="/marketplace" replace />} />
            <Route path="/live"        element={<Live />} />
            <Route path="/community"   element={<Community />} />
            <Route path="/raffles"     element={<Raffles />} />
            <Route path="/messages"    element={<Messages />} />
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/profile"        element={<Profile />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/wallet"         element={<Wallet />} />
            <Route path="/aprende"        element={<Aprende />} />
            <Route path="/admin"       element={<AdminRoute><Admin /></AdminRoute>} />
          </Routes>
          <ChatBot />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
