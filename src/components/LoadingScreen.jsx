import { useEffect, useState } from 'react'

export default function LoadingScreen({ onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2000)
    const t2 = setTimeout(() => onDone?.(), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className="loading-screen"
      style={{
        opacity: phase === 1 ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: phase === 1 ? 'none' : 'all',
      }}
    >
      {/* Subtle gradient bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.04) 0%, transparent 70%)',
      }} />

      <div className="relative flex flex-col items-center gap-8 fade-up">
        {/* Spinner */}
        <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
          <div className="loading-ring" />
        </div>

        {/* Logo */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Kerjain<span style={{ color: '#10b981' }}>.</span>
          </h1>
          <p className="text-neutral-600 text-xs tracking-widest uppercase mt-2 font-medium">
            Loading
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="overflow-hidden rounded-full"
          style={{ width: 160, height: 2, background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="progress-bar h-full rounded-full"
            style={{ background: '#10b981' }}
          />
        </div>
      </div>
    </div>
  )
}
