import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminVerify() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  async function load() {
    const { data } = await supabase
      .from('companies').select('*').eq('status', 'pending').order('created_at')
    setList(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function setujui(id) {
    await supabase.from('companies').update({ status: 'approved', rejection_reason: null }).eq('id', id)
    load()
  }

  async function tolak(id) {
    if (!rejectReason.trim()) return
    await supabase.from('companies').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', id)
    setRejectModal(null)
    setRejectReason('')
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Panel</h1>
        <p className="text-neutral-600 text-sm mt-1">Verifikasi pendaftaran perusahaan baru</p>
      </div>

      {/* Count banner */}
      {!loading && list.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-medium"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: '#fbbf24' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span><b className="text-white">{list.length}</b> perusahaan menunggu verifikasi</span>
        </div>
      )}

      <div>
        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => (
              <div key={i} className="card p-6 flex gap-4">
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                <div className="flex-1 space-y-3">
                  <div className="skeleton" style={{ height: 14, width: '35%' }} />
                  <div className="skeleton" style={{ height: 11, width: '50%' }} />
                  <div className="skeleton" style={{ height: 11, width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="card rounded-2xl py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <svg className="w-8 h-8" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white font-semibold text-base">Semua Bersih</p>
            <p className="text-neutral-600 text-sm mt-2">Tidak ada pendaftaran yang menunggu verifikasi.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map(c => (
              <li key={c.id} className="card job-card p-6">
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg text-neutral-400 shrink-0"
                    style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {c.nama?.charAt(0)?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-base">{c.nama}</p>
                    {c.alamat && (
                      <p className="text-sm text-neutral-600 mt-0.5 flex items-center gap-1.5">
                        📍 {c.alamat}
                      </p>
                    )}
                    {c.deskripsi && (
                      <p className="text-sm text-neutral-700 mt-2 leading-relaxed line-clamp-2">{c.deskripsi}</p>
                    )}
                    <p className="text-xs text-neutral-700 mt-3 font-medium">
                      Didaftarkan: {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => setujui(c.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all"
                      style={{ background: '#10b981', color: '#fff' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Setujui
                    </button>
                    <button
                      onClick={() => { setRejectModal(c.id); setRejectReason('') }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all"
                      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Tolak
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="card-elevated p-8 max-w-md w-full fade-up">
            <h2 className="text-lg font-bold text-white mb-2">Tolak Perusahaan?</h2>
            <p className="text-neutral-600 text-sm mb-5">Masukkan alasan yang jelas agar perusahaan bisa memperbaiki pendaftarannya.</p>
            <textarea
              className="input-dark resize-none"
              placeholder="Alasan penolakan..."
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="btn-ghost flex-1 py-3 text-sm">
                Batal
              </button>
              <button
                onClick={() => tolak(rejectModal)}
                disabled={!rejectReason.trim()}
                className="flex-1 py-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: '#ef4444', color: '#fff' }}>
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
