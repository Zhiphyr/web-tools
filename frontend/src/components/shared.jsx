export const BOX = 'border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000]'
export const PRESS =
  'transition-all hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:-translate-x-0.5 sm:hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] sm:hover:shadow-[8px_8px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] disabled:opacity-50 disabled:pointer-events-none'
export const WIDTH = 'w-full max-w-2xl'

export function formatDuration(seconds) {
  if (seconds == null) return null
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatSize(bytes) {
  if (bytes == null) return null
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

export function ProgressBar({ percent }) {
  const indeterminate = percent == null
  return (
    <div>
      <div className="h-8 w-full overflow-hidden border-[3px] border-black bg-white">
        <div
          className="caution-stripes h-full transition-[width] duration-200"
          style={{ width: indeterminate ? '100%' : `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-center font-black uppercase text-xs sm:text-sm">
        {indeterminate ? 'Descargando...' : `${percent}% Descargando...`}
      </p>
    </div>
  )
}
