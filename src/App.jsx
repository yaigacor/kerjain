import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LoadingScreen from './components/LoadingScreen'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import MyApplications from './pages/pencari/MyApplications'
import CompanyDashboard from './pages/perusahaan/CompanyDashboard'
import AdminVerify from './pages/admin/AdminVerify'

export default function App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      <div
        style={{
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
          minHeight: '100vh',
          background: '#0a0a0a',
        }}
      >
        <Navbar />
        <Routes>
          <Route path="/" element={<Jobs />} />
          <Route path="/lowongan/:id" element={<JobDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/lamaran" element={
            <ProtectedRoute roles={['pencari_kerja']}><MyApplications /></ProtectedRoute>
          } />
          <Route path="/perusahaan" element={
            <ProtectedRoute roles={['perusahaan']}><CompanyDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminVerify /></ProtectedRoute>
          } />
        </Routes>
      </div>
    </>
  )
}
