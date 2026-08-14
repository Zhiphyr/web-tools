import { useEffect, useRef, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { checkHealth } from '../lib/api'

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

export function useBackendStatus() {
  const [status, setStatus] = useState('checking')
  const [checkingSlow, setCheckingSlow] = useState(false)
  const healthResolvedRef = useRef(false)

  function markAwake() {
    healthResolvedRef.current = true
    setStatus('awake')
  }

  useEffect(() => {
    let cancelled = false
    const MAX_ATTEMPTS = 8
    const RETRY_DELAY_MS = 5000

    async function pollHealth(attempt) {
      if (cancelled || healthResolvedRef.current) return

      const { ok } = await checkHealth()
      if (cancelled || healthResolvedRef.current) return

      if (ok) {
        healthResolvedRef.current = true
        setStatus('awake')
        return
      }

      if (attempt >= MAX_ATTEMPTS) {
        setStatus('offline')
        return
      }

      setCheckingSlow(true)
      setTimeout(() => pollHealth(attempt + 1), RETRY_DELAY_MS)
    }

    pollHealth(1)
    return () => {
      cancelled = true
    }
  }, [])

  return { status, checkingSlow, markAwake }
}

export function BackendStatusBanner({ status, checkingSlow }) {
  if (status === 'checking') {
    return (
      <span className="flex items-center gap-1.5 border-[2.5px] sm:border-[3px] border-black bg-white px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase">
        <Spinner className="h-3 w-3" />
        {checkingSlow ? 'Despertando servidor... puede tardar' : 'Verificando servidor...'}
      </span>
    )
  }
  
  if (status === 'awake') {
    return (
      <span className="flex items-center gap-1.5 border-[2.5px] sm:border-[3px] border-black bg-lime-300 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase">
        <Wifi className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
        Backend activo
      </span>
    )
  }
  
  if (status === 'offline') {
    return (
      <span className="flex items-center gap-1.5 border-[2.5px] sm:border-[3px] border-black bg-red-400 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase">
        <WifiOff className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
        Backend no responde
      </span>
    )
  }
  
  return null
}
