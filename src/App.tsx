import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
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
import Grading from './pages/Grading'
import Chat from './pages/Chat'
import ListingDetail from './pages/ListingDetail'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#0c0a1e] text-white">
          <Navbar />
          <Routes>
            <Route path="/"            element={<Landing />} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/shop"        element={<Navigate to="/marketplace" replace />} />
            <Route path="/live"        element={<ProtectedRoute><Live /></ProtectedRoute>} />
            <Route path="/community"   element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/raffles"     element={<ProtectedRoute><Raffles /></ProtectedRoute>} />
            <Route path="/messages"    element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/wallet"         element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/aprende"        element={<ProtectedRoute><Aprende /></ProtectedRoute>} />
            <Route path="/grading"        element={<ProtectedRoute><Grading /></ProtectedRoute>} />
            <Route path="/chat"           element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/listing/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
            <Route path="/admin"       element={<AdminRoute><Admin /></AdminRoute>} />
          </Routes>
          <ChatBot />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
