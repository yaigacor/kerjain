import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import StarRating from '../../components/StarRating'
import ChatPanel from '../../components/ChatPanel'

const STATUS_CONFIG = {
  dikirim:   { bg: 'rgba(82,82,82,0.15)', color: '#737373', icon: '📤', label: 'Dikirim',    dot: '#525252' },
  dilihat:   { bg: 'rgba(251,191,36,0.08)', color: '#fbbf24', icon: '👀', label: 'Dilihat',    dot: '#fbbf24' },
  wawancara: { bg: 'rgba(59,130,246,0.08)', color: '#60a5fa', icon: '🎙️', label: 'Wawancara', dot: '#60a5fa' },
  diterima:  { bg: 'rgba(16,185,129,0.08)', color: '#10b981', icon: '✓', label: 'Diterima',   dot: '#10b981' },
  ditolak:   { bg: 'rgba(239,68,68,0.08)', color: '#f87171', icon: '✕', label: 'Ditolak',    dot: '#f87171' },
}

function Avatar({ name }) {
  return (
    <div style={{
      width: 36, height: 36, minWidth: 36,
      borderRadius: '50%',
      background: 'var(--avatar-bg)',
      border: '1px solid var(--avatar-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: 13, color: 'var(--avatar-text)',
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
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) { setMsg({ text: 'Format file harus PDF atau DOC/DOCX', ok: false }); return }
    if (file.size > 5 * 1024 * 1024) { setMsg({ text: 'Ukuran file maksimal 5 MB', ok: false }); return }
    setUploading(true); setMsg({ text: '', ok: false })
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${user.id}/cv_${Date.now()}.${ext}`
      if (cvUrl) { const oldPath = cvUrl.split('/cv/')[1]; if (oldPath) await supabase.storage.from('cv').remove([decodeURIComponent(oldPath)]) }
      const { error: uploadErr } = await supabase.storage.from('cv').upload(filePath, file, { cacheControl: '3600', upsert: true })
      if (uploadErr) throw uploadErr
      const { data: urlData } = supabase.storage.from('cv').getPublicUrl(filePath)
      const newUrl = urlData?.publicUrl || filePath
      const { error: updateErr } = await supabase.from('profiles').update({ cv_url: newUrl }).eq('id', user.id)
      if (updateErr) throw updateErr
      setCvUrl(newUrl); setCvName(file.name); setMsg({ text: 'CV berhasil diupload!', ok: true })
    } catch (err) { setMsg({ text: err.message || 'Gagal upload CV', ok: false }) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function handleDelete() {
    if (!cvUrl) return
    setUploading(true)
    try {
      const oldPath = cvUrl.split('/cv/')[1]
      if (oldPath) await supabase.storage.from('cv').remove([decodeURIComponent(oldPath)])
      await supabase.from('profiles').update({ cv_url: null }).eq('id', user.id)
      setCvUrl(null); setCvName(''); setMsg({ text: 'CV berhasil dihapus', ok: true })
    } catch (err) { setMsg({ text: err.message || 'Gagal hapus CV', ok: false }) }
    finally { setUploading(false) }
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Curriculum Vitae</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Upload CV kamu agar perusahaan bisa melihat profilmu</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
          <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
      {msg.text && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium mb-4 fade-up"
          style={{ background: msg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, color: msg.ok ? 'var(--accent)' : '#f87171' }}>
          <span>{msg.ok ? '✓' : '!'}</span><span>{msg.text}</span>
        </div>
      )}
      {cvUrl ? (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--tag-bg)', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.08)' }}>
            <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{cvName || 'CV.pdf'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>PDF / DOC</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'var(--tag-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              {uploading ? 'Uploading...' : 'Ganti'}
            </button>
            <button onClick={handleDelete} disabled={uploading} className="text-xs font-medium px-2 py-1.5 rounded-lg transition-all" style={{ color: '#f87171' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full p-6 rounded-xl text-center transition-all group"
          style={{ border: '2px dashed var(--border)', background: 'var(--tag-bg)' }}>
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="loading-ring" style={{ width: 16, height: 16, borderWidth: 2 }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Mengupload...</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Klik untuk upload CV</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>PDF, DOC, DOCX — Max 5MB</p>
            </>
          )}
        </button>
      )}
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} className="hidden" />
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
  const [ratings, setRatings] = useState({}) // { app_id: { skor, komentar } }
  const [ratingForm, setRatingForm] = useState({}) // { app_id: { skor, komentar } }
  const [ratingBusy, setRatingBusy] = useState('')
  const [chatAppId, setChatAppId] = useState(null)
  const [chatOtherName, setChatOtherName] = useState('')
  const [profileData, setProfileData] = useState(null)

  async function load() {
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, jadwal_wawancara, jobs(judul, company_id, companies(id, nama))')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)

    // Load my ratings
    if (data && data.length > 0) {
      const appIds = data.map(a => a.id)
      const { data: myRatings } = await supabase
        .from('ratings')
        .select('application_id, skor, komentar')
        .eq('rater_id', user.id)
        .in('application_id', appIds)
      if (myRatings) {
        const map = {}
        myRatings.forEach(r => { map[r.application_id] = { skor: r.skor, komentar: r.komentar } })
        setRatings(map)
      }
    }
  }

  // Load profile completeness
  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase.from('profiles').select('nama, no_hp, pendidikan, skill, pengalaman, tentang, cv_url').eq('id', user.id).single()
      setProfileData(data)
    }
    loadProfile()
  }, [user.id])

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

  async function submitRating(appId, companyId) {
    const form = ratingForm[appId]
    if (!form?.skor) return
    setRatingBusy(appId)
    const { error } = await supabase.from('ratings').insert({
      application_id: appId, rater_id: user.id, target_company_id: companyId,
      skor: form.skor, komentar: form.komentar || null,
    })
    setRatingBusy('')
    if (!error) {
      setRatings(prev => ({ ...prev, [appId]: { skor: form.skor, komentar: form.komentar } }))
      setRatingForm(prev => { const n = { ...prev }; delete n[appId]; return n })
    }
  }

  // Profile completeness
  const profilePct = (() => {
    if (!profileData) return 100
    const fields = [profileData.nama, profileData.no_hp, profileData.pendidikan, profileData.skill, profileData.pengalaman, profileData.tentang, profileData.cv_url]
    const filled = fields.filter(f => f && f.toString().trim()).length
    return Math.round((filled / 7) * 100)
  })()

  const counts = items.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc }, {})

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Lamaran Saya</h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--muted)' }}>Kelola CV dan pantau status lamaranmu</p>
      </div>

      {/* Profile completion banner */}
      {profilePct < 100 && (
        <Link to="/profil" className="block mb-5 p-4 rounded-xl transition-all fade-up"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl"></span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>Profil {profilePct}% lengkap</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Lengkapi profilmu untuk peluang lebih besar dari perusahaan</p>
            </div>
            <span className="text-xs font-medium" style={{ color: '#fbbf24' }}>Lengkapi →</span>
          </div>
        </Link>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {[
          { key: 'lamaran', label: 'Lamaran', icon: '' },
          { key: 'cv', label: 'CV Saya', icon: '' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            style={activeTab === tab.key
              ? { background: 'var(--tag-bg)', color: 'var(--text)', border: '1px solid var(--border-hover)' }
              : { color: 'var(--muted)', border: '1px solid transparent' }}>
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
              style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
              <span>🔔</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs mb-0.5" style={{ color: 'var(--text)' }}>Notifikasi Realtime</p>
                <p className="text-xs sm:text-sm truncate">{toast}</p>
              </div>
              <button onClick={() => setToast('')} style={{ color: 'var(--muted)' }}>
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
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>{counts[key] || 0}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    <p className="text-[10px] sm:text-xs font-medium truncate" style={{ color: 'var(--muted)' }}>{cfg.label}</p>
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
                <div className="text-3xl sm:text-4xl mb-3 opacity-30">📭</div>
                <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--text)' }}>Belum Ada Lamaran</p>
                <p className="text-xs sm:text-sm mt-2 mb-5" style={{ color: 'var(--muted)' }}>Mulai eksplorasi lowongan yang menunggumu</p>
                <Link to="/" className="btn-accent text-sm py-2.5 px-6 inline-block">Cari Lowongan</Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map(a => {
                  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.dikirim
                  const myRating = ratings[a.id]
                  const rf = ratingForm[a.id] || {}
                  return (
                    <li key={a.id} className="card p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={a.jobs?.companies?.nama} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{a.jobs?.judul}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{a.jobs?.companies?.nama}</p>
                          <p className="text-[10px] mt-1 hidden sm:block" style={{ color: 'var(--muted)' }}>
                            {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Chat button */}
                          {a.status !== 'ditolak' && (
                            <button onClick={() => { setChatAppId(a.id); setChatOtherName(a.jobs?.companies?.nama || '') }}
                              className="text-[11px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg flex items-center gap-1"
                              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                              💬 <span className="hidden sm:inline">Chat</span>
                            </button>
                          )}
                          <div className="text-[11px] sm:text-xs font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}22` }}>
                            <span className="hidden sm:inline">{cfg.icon}</span> {cfg.label}
                          </div>
                        </div>
                      </div>

                      {/* Jadwal wawancara */}
                      {a.jadwal_wawancara && (
                        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg text-xs"
                          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                          <span></span>
                          <span className="font-medium" style={{ color: '#60a5fa' }}>
                            Jadwal Wawancara: {new Date(a.jadwal_wawancara).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}

                      {/* Rating section for 'diterima' */}
                      {a.status === 'diterima' && (
                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                          {myRating ? (
                            <StarRating value={myRating.skor} readOnly submitted comment={myRating.komentar} label="Rating yang kamu berikan" size={16} />
                          ) : (
                            <StarRating
                              label="Beri rating perusahaan"
                              value={rf.skor || 0}
                              onChange={v => setRatingForm(prev => ({ ...prev, [a.id]: { ...rf, skor: v } }))}
                              comment={rf.komentar || ''}
                              onCommentChange={v => setRatingForm(prev => ({ ...prev, [a.id]: { ...rf, komentar: v } }))}
                              onSubmit={() => submitRating(a.id, a.jobs?.companies?.id)}
                              submitting={ratingBusy === a.id}
                              size={18}
                            />
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {chatAppId && (
        <ChatPanel applicationId={chatAppId} otherName={chatOtherName} onClose={() => setChatAppId(null)} />
      )}
    </div>
  )
}
