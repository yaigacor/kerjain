import { useState } from 'react'

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 20,
  showValue = false,
  count,
  comment,
  onCommentChange,
  onSubmit,
  submitting = false,
  submitted = false,
  label = '',
}) {
  const [hover, setHover] = useState(0)

  return (
    <div>
      {label && <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className="transition-transform"
            style={{
              cursor: readOnly ? 'default' : 'pointer',
              transform: !readOnly && hover === star ? 'scale(1.2)' : 'scale(1)',
              background: 'none',
              border: 'none',
              padding: 1,
            }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24"
              fill={(hover || value) >= star ? '#fbbf24' : 'none'}
              stroke={(hover || value) >= star ? '#fbbf24' : 'var(--muted)'}
              strokeWidth={1.5}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
        {showValue && value > 0 && (
          <span className="text-sm font-semibold ml-1" style={{ color: '#fbbf24' }}>
            {value.toFixed(1)}
          </span>
        )}
        {typeof count === 'number' && (
          <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>
            ({count})
          </span>
        )}
      </div>

      {/* Input mode: comment + submit */}
      {!readOnly && !submitted && (
        <div className="mt-2 space-y-2">
          <textarea
            className="input-dark resize-none text-xs"
            rows={2}
            maxLength={300}
            placeholder="Komentar (opsional, maks 300 karakter)"
            value={comment || ''}
            onChange={e => onCommentChange?.(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {(comment || '').length}/300
            </span>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!value || submitting}
              className="btn-accent text-xs py-1.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Mengirim...' : 'Kirim Rating'}
            </button>
          </div>
        </div>
      )}

      {/* Submitted read-only comment */}
      {submitted && comment && (
        <p className="text-xs mt-1 italic" style={{ color: 'var(--text-secondary)' }}>"{comment}"</p>
      )}
    </div>
  )
}
