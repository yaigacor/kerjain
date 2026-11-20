import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Profil() {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({
    nama: '', no_hp: '', pendidikan: '', skill: '', pengalaman: '', tentang: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', ok: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('nama, no_hp, pendidikan, skill, pengalaman, tentang, cv_url').eq('id', user.id).single()
      if (data) {
        setForm({
          nama: data.nama || '',
          no_hp: data.no_hp || '',
          pendidikan: data.pendidikan || '',
          skill: data.skill || '',
          pengalaman: data.pengalaman || '',
          tentang: data.tentang || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [user.id])

  // Calculate profile completeness
  function getCompleteness() {
    const fields = [form.nama, form.no_hp, form.pendidikan, form.skill, form.pengalaman, form.tentang, profile?.cv_url]
    const filled = fields.filter(f => f && f.toString().trim()).length
    return Math.round((filled / 7) * 100)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMsg({ text: '', ok: false })
    const { error } = await supabase.from('profiles').update({
      nama: form.nama, no_hp: form.no_hp, pendidikan: form.pendidikan,
      skill: form.skill, pengalaman: form.pengalaman, tentang: form.tentang,
    }).eq('id', user.id)
    setSaving(false)
    if (error) setMsg({ text: error.message, ok: false })
    else setMsg({ text: 'Profil berhasil diperbarui!', ok: true })
  }

  const pct = getCompleteness()

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-4"><div className="loading-ring" /></div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Memuat profil...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Profil Saya</h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--muted)' }}>Lengkapi profilmu untuk peluang lebih besar</p>
      </div>

      {/* Progress bar */}
      <div className="card p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Kelengkapan Profil</p>
          <span className="text-sm font-bold" style={{ color: pct === 100 ? 'var(--accent)' : '#fbbf24' }}>{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct === 100 ? 'var(--accent)' : '#fbbf24' }} />
        </div>
        {pct < 100 && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-secondary)' }}>
            Lengkapi semua data untuk mendapatkan perhatian lebih dari perusahaan
          </p>
        )}
      </div>

      {/* Message */}
      {msg.text && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium mb-5 fade-up"
          style={{
            background: msg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: msg.ok ? 'var(--accent)' : '#f87171',
          }}>
          <span>{msg.ok ? '✓' : '!'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="card p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Data Diri</h2>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Nama Lengkap</label>
            <input className="input-dark" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>No. HP</label>
            <input className="input-dark" value={form.no_hp} onChange={e => setForm({ ...form, no_hp: e.target.value })} placeholder="08xxxxxxxxxx" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Pendidikan Terakhir</label>
            <input className="input-dark" value={form.pendidikan} onChange={e => setForm({ ...form, pendidikan: e.target.value })} placeholder="S1 Teknik Informatika" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Skill (pisah dengan koma)</label>
            <input className="input-dark" value={form.skill} onChange={e => setForm({ ...form, skill: e.target.value })} placeholder="React, Node.js, Figma" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Pengalaman</label>
            <textarea className="input-dark resize-none" rows={3} value={form.pengalaman} onChange={e => setForm({ ...form, pengalaman: e.target.value })} placeholder="Ceritakan pengalaman kerjamu..." />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Tentang Saya</label>
            <textarea className="input-dark resize-none" rows={3} value={form.tentang} onChange={e => setForm({ ...form, tentang: e.target.value })} placeholder="Deskripsi singkat tentang dirimu..." />
          </div>

          {/* CV status */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>CV</label>
            {profile?.cv_url ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>CV sudah diupload</span>
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium underline ml-1" style={{ color: 'var(--text-secondary)' }}>Lihat</a>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: '#f87171' }} />
                <span className="text-xs" style={{ color: '#f87171' }}>Belum upload CV — upload di halaman Lamaran Saya</span>
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-accent w-full py-3 text-sm">
          {saving ? 'Menyimpan...' : 'Simpan Profil'}
        </button>
      </form>
    </div>
  )
}
