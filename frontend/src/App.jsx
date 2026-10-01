import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout, AppLayout } from './components/Layout'
import Home from './pages/Home'
import { Login, Register } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Skills from './pages/Skills'
import Matching from './pages/Matching'
import Requests from './pages/Requests'
import Courses from './pages/Courses'
import Progress from './pages/Progress'
import Reviews from './pages/Reviews'
import Admin from './pages/Admin'
import './App.css'
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute'

export default function App() {
  return <BrowserRouter><Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/skills" element={<Skills />} />
      <Route path="/courses" element={<Courses />} />
    </Route>
    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/matching" element={<Matching />} />
      <Route path="/requests" element={<Requests />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>
}
