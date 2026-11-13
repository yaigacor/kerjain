import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Jobs from './pages/Jobs'
import CompanyDashboard from './pages/perusahaan/CompanyDashboard'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Jobs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/perusahaan" element={
          <ProtectedRoute roles={['perusahaan']}><CompanyDashboard /></ProtectedRoute>
        } />
      </Routes>
    </>
  )
}