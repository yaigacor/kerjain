import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const STATUS_CONFIG = {
  dikirim:   { bg: '#1a1a1a', color: '#737373', icon: '', label: 'Dikirim',    dot: '#525252' },
  dilihat:   { bg: 'rgba(251,191,36,0.08)', color: '#fbbf24', icon: '', label: 'Dilihat',    dot: '#fbbf24' },
  wawancara: { bg: 'rgba(59,130,246,0.08)', color: '#60a5fa', icon: '', label: 'Wawancara', dot: '#60a5fa' },
  diterima:  { bg: 'rgba(16,185,129,0.08)', color: '#10b981', icon: '✓', label: 'Diterima',   dot: '#10b981' },
  ditolak:   { bg: 'rgba(239,68,68,0.08)', color: '#f87171', icon: '✕', label: 'Ditolak',    dot: '#f87171' },
}

function Avatar({ name }) {
  return (
    <div style={{
      width: 36, height: 36, minWidth: 36,
      borderRadius: '50%',
      background: '#1a1a1a',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: 13, color: '#a3a3a3',
    }}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  )
}

/* ── CV Upload Section ── */
function CvUpload({ user, profile }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [cvUrl, setCvUrl] = useState(profile?.cv_url || null)
  const [cvName, setCvName] = useState('')
  const [msg, setMsg] = useState({ text: '', ok: false })

  // Resolve filename from cv_url on mount
  useEffect(() => {
    if (profile?.cv_url) {
      setCvUrl(profile.cv_url)
      const parts = profile.cv_url.split('/')
      setCvName(decodeURIComponent(parts[parts.length - 1] || 'CV.pdf'))
    }
  }, [profile?.cv_url])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setMsg({ text: 'Format file harus PDF atau DOC/DOCX', ok: false })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ text: 'Ukuran file maksimal 5 MB', ok: false })
      return
    }

    setUploading(true)
    setMsg({ text: '', ok: false })

    try {
      const ext = file.name.split('.').pop()
      const filePath = `${user.id}/cv_${Date.now()}.${ext}`

      // Delete old file if exists
      if (cvUrl) {
        const oldPath = cvUrl.split('/cv/')[1]
        if (oldPath) {
          await supabase.storage.from('cv').remove([decodeURIComponent(oldPath)])
        }
      }

      // Upload new file
      const { error: uploadErr } = await supabase.storage.from('cv').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })
      if (uploadErr) throw uploadErr

      // Get public url
      const { data: urlData } = supabase.storage.from('cv').getPublicUrl(filePath)
      const newUrl = urlData?.publicUrl || filePath

      // Update profile
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ cv_url: newUrl })
        .eq('id', user.id)
      if (updateErr) throw updateErr

      setCvUrl(newUrl)
      setCvName(file.name)
      setMsg({ text: 'CV berhasil diupload!', ok: true })
    } catch (err) {
      setMsg({ text: err.message || 'Gagal upload CV', ok: false })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete() {
    if (!cvUrl) return
    setUploading(true)
    try {
      const oldPath = cvUrl.split('/cv/')[1]
      if (oldPath) {
        await supabase.storage.from('cv').remove([decodeURIComponent(oldPath)])
      }
      await supabase.from('profiles').update({ cv_url: null }).eq('id', user.id)
      setCvUrl(null)
      setCvName('')
      setMsg({ text: 'CV berhasil dihapus', ok: true })
    } catch (err) {
      setMsg({ text: err.message || 'Gagal hapus CV', ok: false })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Curriculum Vitae</h2>
          <p className="text-xs text-neutral-600 mt-0.5">Upload CV kamu agar perusahaan bisa melihat profilmu</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <svg className="w-4 h-4" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

      {/* Message */}
      {msg.text && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium mb-4 fade-up"
          style={{
            background: msg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: msg.ok ? '#10b981' : '#f87171',
          }}>
          <span>{msg.ok ? '✓' : '!'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {cvUrl ? (
        /* Has CV */
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,0.08)' }}>
            <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{cvName || 'CV.pdf'}</p>
            <p className="text-xs text-neutral-600 mt-0.5">PDF / DOC</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a3a3a3' }}
            >
              {uploading ? 'Uploading...' : 'Ganti'}
            </button>
            <button
              onClick={handleDelete}
              disabled={uploading}
              className="text-xs font-medium px-2 py-1.5 rounded-lg transition-all"
              style={{ color: '#f87171' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* No CV — upload area */
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full p-6 rounded-xl text-center transition-all hover:border-emerald-500/30 group"
          style={{ border: '2px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="loading-ring" style={{ width: 16, height: 16, borderWidth: 2 }} />
              <p className="text-sm text-neutral-500 font-medium">Mengupload...</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-neutral-400 group-hover:text-white transition-colors">
                Klik untuk upload CV
              </p>
              <p className="text-xs text-neutral-700 mt-1">PDF, DOC, DOCX — Max 5MB</p>
            </>
          )}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}

/* ── Main Component ── */
export default function MyApplications() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [activeTab, setActiveTab] = useState('lamaran')

  async function load() {
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, jobs(judul, companies(nama))')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('lamaran-saya')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'applications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setToast(`Status lamaranmu berubah menjadi: ${payload.new.status}`)
          load()
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user.id])

  const counts = items.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc }, {})

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Lamaran Saya</h1>
        <p className="text-neutral-600 text-xs sm:text-sm mt-1">Kelola CV dan pantau status lamaranmu</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6"
        style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { key: 'lamaran', label: 'Lamaran', icon: '' },
          { key: 'cv', label: 'CV Saya', icon: '' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            style={activeTab === tab.key
              ? { background: 'rgba(255,255,255,0.08)', color: '#f5f5f5', border: '1px solid rgba(255,255,255,0.1)' }
              : { color: '#525252', border: '1px solid transparent' }
            }
          >
            <span className="text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* CV Tab */}
      {activeTab === 'cv' && (
        <div className="fade-up">
          <CvUpload user={user} profile={profile} />
        </div>
      )}

      {/* Lamaran Tab */}
      {activeTab === 'lamaran' && (
        <div className="fade-up">
          {/* Realtime Toast */}
          {toast && (
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl mb-5 text-sm font-medium fade-up"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
              <span></span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-xs mb-0.5">Notifikasi Realtime</p>
                <p className="text-xs sm:text-sm truncate">{toast}</p>
              </div>
              <button onClick={() => setToast('')} className="text-neutral-600 hover:text-white transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Stats */}
          {items.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className="card p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-white">{counts[key] || 0}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    <p className="text-[10px] sm:text-xs font-medium text-neutral-600 truncate">{cfg.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List */}
          <div>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="card p-4 flex gap-3">
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                    <div className="flex-1 space-y-2 py-0.5">
                      <div className="skeleton" style={{ height: 13, width: '50%' }} />
                      <div className="skeleton" style={{ height: 10, width: '30%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="card rounded-2xl py-14 sm:py-20 text-center">
                <div className="text-3xl sm:text-4xl mb-3 opacity-30"></div>
                <p className="text-white font-semibold text-sm sm:text-base">Belum Ada Lamaran</p>
                <p className="text-neutral-600 text-xs sm:text-sm mt-2 mb-5">Mulai eksplorasi lowongan yang menunggumu</p>
                <Link to="/" className="btn-accent text-sm py-2.5 px-6 inline-block">
                  Cari Lowongan
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map(a => {
                  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.dikirim
                  return (
                    <li key={a.id}
                      className="card job-card p-3 sm:p-4 flex items-center gap-3">
                      <Avatar name={a.jobs?.companies?.nama} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{a.jobs?.judul}</p>
                        <p className="text-xs text-neutral-600 mt-0.5 truncate">{a.jobs?.companies?.nama}</p>
                        <p className="text-[10px] text-neutral-700 mt-1 hidden sm:block">
                          {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div
                        className="shrink-0 text-[11px] sm:text-xs font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}22` }}
                      >
                        <span className="hidden sm:inline">{cfg.icon}</span> {cfg.label}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
