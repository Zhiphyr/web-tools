import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Camera,
  ClipboardPaste,
  Clock,
  ExternalLink,
  Film,
  Headphones,
  Music2,
  Play,
  Rocket,
  RotateCcw,
  Shield,
  User,
  Wifi,
  WifiOff,
  X as XIcon,
  Zap,
} from 'lucide-react'
import { checkHealth, downloadAudio, downloadVideo, getVideoInfo } from './lib/api'

function formatDuration(seconds) {
  if (seconds == null) return null
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSize(bytes) {
  if (bytes == null) return null
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function detectPlatform(inputUrl) {
  if (!inputUrl) return null
  let hostname
  try {
    hostname = new URL(inputUrl).hostname.toLowerCase()
  } catch {
    return null
  }
  if (hostname.endsWith('youtube.com') || hostname === 'youtu.be') return 'youtube'
  if (hostname.endsWith('instagram.com')) return 'instagram'
  if (hostname.endsWith('tiktok.com')) return 'tiktok'
  if (hostname.endsWith('twitter.com') || hostname === 'x.com') return 'twitter'
  return null
}

function Spinner({ className = 'h-4 w-4' }) {
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

function ProgressBar({ percent }) {
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

function QualityPills({ options, selected, onSelect, disabled }) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {options.map((opt) => {
        const isSelected = selected === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            disabled={disabled}
            className={`border-[2.5px] sm:border-[3px] border-black px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase transition-all disabled:opacity-50 disabled:pointer-events-none ${
              isSelected
                ? 'bg-black text-white shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]'
                : 'bg-white text-black hover:bg-gray-100 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[3px_3px_0_0_#000]'
            }`}
          >
            {opt.label}
            {opt.size != null && (
              <span className="ml-1 font-normal opacity-60">~{formatSize(opt.size)}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

const MARQUEE_ITEMS = [
  'YOUTUBE TO MP3',
  'TIKTOK SIN MARCA DE AGUA',
  'INSTAGRAM REELS',
  'AUDIO EN HD',
]

function Marquee() {
  const track = (
    <span className="flex items-center gap-6 sm:gap-8 pr-6 sm:pr-8">
      {MARQUEE_ITEMS.map((item, i) => (
        <span key={i} className="flex items-center gap-6 sm:gap-8">
          <span>{item}</span>
          <span aria-hidden="true">✦</span>
        </span>
      ))}
    </span>
  )
  return (
    <div className="w-full overflow-hidden border-b-[3px] border-black bg-black py-1.5 sm:py-2 text-white">
      <div className="marquee-track flex w-max whitespace-nowrap text-xs sm:text-sm font-black uppercase tracking-wide">
        {track}
        {track}
      </div>
    </div>
  )
}

const BOX = 'border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000]'
const PRESS =
  'transition-all hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:-translate-x-0.5 sm:hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] sm:hover:shadow-[8px_8px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] disabled:opacity-50 disabled:pointer-events-none'
const WIDTH = 'w-full max-w-2xl'

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', Icon: Play, activeBg: 'bg-red-400' },
  { id: 'instagram', label: 'Instagram', Icon: Camera, activeBg: 'bg-fuchsia-400' },
  { id: 'tiktok', label: 'TikTok', Icon: Music2, activeBg: 'bg-cyan-300' },
  { id: 'twitter', label: 'X / Twitter', Icon: XIcon, activeBg: 'bg-white' },
]

const BADGES = [
  { Icon: Zap, text: '100% GRATIS & SIN LÍMITES', rotate: '-rotate-1 sm:-rotate-2', className: 'bg-yellow-300' },
  { Icon: Shield, text: 'SIN MARCA DE AGUA', rotate: 'rotate-1 sm:rotate-2', className: 'bg-cyan-300' },
  { Icon: Rocket, text: 'ALTA VELOCIDAD', rotate: '-rotate-1 sm:-rotate-2', className: 'bg-lime-300' },
]

const AUDIO_QUALITY_DEFS = [
  { value: '320', label: 'MP3 320K' },
  { value: '128', label: 'MP3 128K' },
  { value: 'wav', label: 'WAV' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'PEGA EL ENLACE',
    desc: 'Copia el link de YouTube, Reels, TikTok o X y dale al botón de pegar.',
    bg: 'bg-yellow-300',
    Icon: ClipboardPaste,
  },
  {
    step: '02',
    title: 'ELIGE FORMATO',
    desc: 'Selecciona resolución en HD o extrae el audio limpio en MP3 a 320kbps.',
    bg: 'bg-cyan-300',
    Icon: Film,
  },
  {
    step: '03',
    title: 'DESCARGA DIRECTA',
    desc: 'Descarga instantánea a tu dispositivo sin anuncios ni esperas molestas.',
    bg: 'bg-lime-300',
    Icon: Rocket,
  },
]

function HowItWorks() {
  return (
    <div className={`mt-8 sm:mt-10 flex flex-col ${WIDTH} gap-3 sm:gap-4`}>
      <div className="flex items-center gap-2">
        <span className="bg-black px-2.5 py-0.5 text-[11px] sm:text-xs font-black uppercase text-white">
          ✦ GUÍA RÁPIDA
        </span>
        <span className="text-[11px] sm:text-xs font-bold uppercase text-black/60">¿CÓMO DESCARGAR?</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {HOW_IT_WORKS.map((item) => (
          <div
            key={item.step}
            className={`flex flex-col gap-1.5 sm:gap-2 bg-white p-3.5 sm:p-4 ${BOX} transition-transform hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between">
              <span className={`border-[2px] border-black ${item.bg} px-2 py-0.5 text-[10px] sm:text-xs font-black`}>
                PASO {item.step}
              </span>
              <item.Icon className="h-4 w-4 sm:h-5 sm:w-5 text-black" strokeWidth={2.5} />
            </div>
            <h3 className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-black uppercase">{item.title}</h3>
            <p className="text-[11px] sm:text-xs font-bold leading-relaxed text-black/70">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errorStatus, setErrorStatus] = useState(null)
  const [lastAction, setLastAction] = useState(null)
  const [videoInfo, setVideoInfo] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [progress, setProgress] = useState(null)
  const [selectedHeight, setSelectedHeight] = useState(null)
  const [selectedAudioQuality, setSelectedAudioQuality] = useState('320')
  const [backendStatus, setBackendStatus] = useState('checking')
  const [checkingSlow, setCheckingSlow] = useState(false)
  const healthResolvedRef = useRef(false)

  function markBackendAwake() {
    healthResolvedRef.current = true
    setBackendStatus('awake')
  }

  function handleApiError(err) {
    const status = err.cause?.status ?? null
    setError(err.message)
    setErrorStatus(status)
    // A defined status means the backend actually answered (even with an error) — it's awake.
    if (status != null) markBackendAwake()
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
        setBackendStatus('awake')
        return
      }

      if (attempt >= MAX_ATTEMPTS) {
        setBackendStatus('offline')
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

  const busy = loading || downloading !== null

  function resetResults() {
    setError(null)
    setVideoInfo(null)
  }

  function handleClear() {
    setUrl('')
    resetResults()
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text.trim())
      resetResults()
    } catch {
      setError('No se pudo leer el portapapeles. Revisá los permisos del navegador.')
      setErrorStatus(null)
    }
  }

  async function doSearch(targetUrl) {
    const trimmed = targetUrl.trim()
    if (!trimmed) return

    if (!/^https?:\/\//i.test(trimmed)) {
      setError('Ese link no parece válido. Tiene que empezar con http:// o https://')
      setErrorStatus(null)
      return
    }

    setLoading(true)
    setError(null)
    setVideoInfo(null)
    setLastAction({ type: 'search' })

    try {
      const info = await getVideoInfo(trimmed)
      setVideoInfo(info)
      setSelectedHeight(info.video_qualities[0]?.height ?? null)
      markBackendAwake()
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    doSearch(url)
  }

  const detectedByUrl = detectPlatform(url)
  const detectedByExtractor = videoInfo?.extractor ? detectPlatform(videoInfo.extractor) : null
  const activePlatform = detectedByUrl || detectedByExtractor

  const isYouTube = activePlatform === 'youtube' || (videoInfo?.extractor?.toLowerCase().includes('youtube') ?? false)

  async function handleDownload(type) {
    setDownloading(type)
    setProgress(null)
    setError(null)
    setLastAction({ type: 'download', kind: type })

    try {
      if (type === 'video') {
        const height = isYouTube ? selectedHeight : null
        await downloadVideo(url.trim(), height, setProgress)
      } else {
        const quality = isYouTube ? selectedAudioQuality : '320'
        await downloadAudio(url.trim(), quality, setProgress)
      }
      markBackendAwake()
    } catch (err) {
      handleApiError(err)
    } finally {
      setDownloading(null)
      setProgress(null)
    }
  }

  function handleRetry() {
    if (!lastAction) return
    if (lastAction.type === 'search') {
      doSearch(url)
    } else {
      handleDownload(lastAction.kind)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between text-black">
      <div className="flex w-full flex-col items-center">
        <Marquee />

        <main className="flex w-full flex-col items-center px-3 sm:px-4 py-8 sm:py-12">
          <div className="mb-3 sm:mb-4 flex justify-center text-center">
            {backendStatus === 'checking' && (
              <span className="flex items-center gap-1.5 border-[2.5px] sm:border-[3px] border-black bg-white px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase">
                <Spinner className="h-3 w-3" />
                {checkingSlow ? 'Despertando servidor... puede tardar' : 'Verificando servidor...'}
              </span>
            )}
            {backendStatus === 'awake' && (
              <span className="flex items-center gap-1.5 border-[2.5px] sm:border-[3px] border-black bg-lime-300 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase">
                <Wifi className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                Backend activo
              </span>
            )}
            {backendStatus === 'offline' && (
              <span className="flex items-center gap-1.5 border-[2.5px] sm:border-[3px] border-black bg-red-400 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase">
                <WifiOff className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                Backend no responde
              </span>
            )}
          </div>

          <h1
            className={`inline-block -rotate-1 bg-yellow-300 px-4 py-2 sm:px-6 sm:py-3 text-2xl sm:text-4xl text-center font-black uppercase tracking-tight ${BOX}`}
          >
            Descargar video o audio
          </h1>

          <div className={`mt-4 sm:mt-6 flex ${WIDTH} flex-wrap justify-center gap-2 sm:gap-3`}>
            {BADGES.map((b) => (
              <span
                key={b.text}
                className={`flex items-center gap-1 sm:gap-1.5 border-[2.5px] sm:border-[3px] border-black px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase ${b.rotate} ${b.className} ${BOX}`}
              >
                <b.Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} aria-hidden="true" />
                {b.text}
              </span>
            ))}
          </div>

          <form onSubmit={handleSearch} className={`mt-6 sm:mt-8 flex flex-col sm:flex-row ${WIDTH} gap-2.5 sm:gap-3`}>
            <div className="relative w-full sm:flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="PEGÁ EL LINK (YOUTUBE, TIKTOK, INSTAGRAM, X...)"
                className={`w-full bg-white py-3 pl-3.5 pr-11 text-xs sm:text-sm font-bold placeholder:font-normal placeholder:text-black/40 focus:outline-none ${BOX}`}
              />
              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={busy}
                  aria-label="Limpiar"
                  className="absolute right-2 top-1/2 flex h-7 w-7 sm:h-8 sm:w-8 -translate-y-1/2 items-center justify-center border-[2px] sm:border-[3px] border-black bg-[#ff5c5c] hover:bg-[#ff7a7a] active:translate-y-[-40%] disabled:opacity-50"
                >
                  <XIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black" strokeWidth={3} aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="flex w-full gap-2.5 sm:w-auto sm:gap-3">
              <button
                type="button"
                onClick={handlePaste}
                disabled={busy}
                className={`flex flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap bg-cyan-300 px-3.5 sm:px-4 py-3 text-xs sm:text-sm font-black uppercase hover:bg-cyan-200 ${BOX} ${PRESS}`}
              >
                <ClipboardPaste className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                Pegar
              </button>
              <button
                type="submit"
                disabled={busy}
                className={`flex flex-1 sm:w-36 items-center justify-center whitespace-nowrap bg-yellow-300 px-4 sm:px-6 py-3 text-xs sm:text-sm font-black uppercase hover:bg-yellow-200 ${BOX} ${PRESS}`}
              >
                {loading ? <Spinner /> : 'Buscar'}
              </button>
            </div>
          </form>

          <div className={`mt-3 sm:mt-4 grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap ${WIDTH}`}>
            {PLATFORMS.map((p) => {
              const isActive = activePlatform === p.id
              return (
                <span
                  key={p.label}
                  className={`flex items-center justify-center sm:justify-start gap-1.5 border-[2.5px] sm:border-[3px] border-black px-2 sm:px-3 py-1.5 sm:py-1 text-[11px] sm:text-xs font-black uppercase transition-all duration-150 ${
                    isActive
                      ? `${p.activeBg} shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000] scale-[1.02] sm:scale-105 -translate-y-0.5`
                      : 'bg-white/80 text-black/60 opacity-75'
                  }`}
                >
                  <p.Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} aria-hidden="true" />
                  <span>{p.label}</span>
                  {isActive && (
                    <span className="ml-1 bg-black px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black text-white">
                      ACTIVO
                    </span>
                  )}
                </span>
              )
            })}
          </div>

          {loading && (
            <div className={`mt-6 sm:mt-8 flex ${WIDTH} items-center justify-center gap-3 bg-white p-6 sm:p-8 ${BOX}`}>
              <Spinner className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="font-black uppercase text-xs sm:text-base">Buscando información...</span>
            </div>
          )}

          {!loading && error && (
            <div className={`mt-6 sm:mt-8 ${WIDTH} overflow-hidden ${BOX}`}>
              <div className="flex items-center gap-2 bg-black px-3 sm:px-4 py-2">
                <AlertTriangle className="h-4 w-4 text-white" strokeWidth={2.5} aria-hidden="true" />
                <span className="font-black uppercase text-xs sm:text-sm text-white">
                  System Error // {errorStatus ?? 'VALIDATION'}
                </span>
              </div>
              <div className="bg-red-300 p-3 sm:p-4">
                <p className="font-bold text-xs sm:text-sm">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className={`mt-3 bg-yellow-300 px-3 sm:px-4 py-2 text-xs sm:text-sm font-black uppercase hover:bg-yellow-200 ${BOX} ${PRESS}`}
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {!loading && !error && !videoInfo && <HowItWorks />}

          {!loading && videoInfo && (
            <div className={`mt-6 sm:mt-8 flex flex-col gap-4 sm:gap-5 ${WIDTH} bg-white p-4 sm:p-5 ${BOX}`}>
              {/* Header con botón de Nueva Búsqueda */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-black pb-3">
                <div className="flex items-center gap-2">
                  <span className="border-[2px] border-black bg-lime-300 px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase">
                    ✓ DETECTADO
                  </span>
                  <span className="bg-black px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase text-white">
                    {videoInfo.extractor}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={busy}
                  className={`flex items-center gap-1.5 bg-yellow-300 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase hover:bg-yellow-200 ${BOX} ${PRESS}`}
                >
                  <RotateCcw className="h-3 w-3" strokeWidth={3} />
                  Nueva Búsqueda
                </button>
              </div>

              {/* Thumbnail e Información */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                {videoInfo.thumbnail && (
                  <div className="relative w-full shrink-0 overflow-hidden border-[3px] border-black bg-black sm:w-44">
                    <img
                      src={videoInfo.thumbnail}
                      alt=""
                      className="aspect-video w-full object-cover sm:h-28"
                      onError={(e) => {
                        e.currentTarget.parentElement.style.display = 'none'
                      }}
                    />
                    {videoInfo.duration != null && (
                      <span className="absolute bottom-1 right-1 flex items-center gap-1 bg-black/90 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-black text-white">
                        <Clock className="h-3 w-3" strokeWidth={2.5} />
                        {formatDuration(videoInfo.duration)}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                  <h2 className="line-clamp-2 text-sm sm:text-base md:text-lg font-black uppercase leading-tight">
                    {videoInfo.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {videoInfo.uploader && (
                      <span className="flex items-center gap-1 border-[2px] border-black bg-yellow-300 px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase text-black">
                        <User className="h-3 w-3" strokeWidth={2.5} />
                        {videoInfo.uploader}
                      </span>
                    )}
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 border-[2px] border-black bg-white px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase hover:bg-gray-100"
                      >
                        <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
                        Ver original
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de Descarga Directa (Reels, TikTok, X) */}
              {!isYouTube && (
                <div className="flex flex-col gap-3 border-t-[3px] border-black pt-3 sm:pt-4">
                  <div className="flex items-center justify-between">
                    <span className="bg-black px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-black uppercase text-white">
                      ⚡ DESCARGA DIRECTA
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase text-black/60">
                      MÁXIMA CALIDAD
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                    {downloading === 'video' ? (
                      <div className="col-span-full">
                        <ProgressBar percent={progress} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownload('video')}
                        disabled={busy}
                        className={`flex items-center justify-center gap-2 bg-lime-300 py-3 sm:py-3.5 px-4 text-xs sm:text-sm font-black uppercase hover:bg-lime-200 ${BOX} ${PRESS}`}
                      >
                        <Film className="h-4 w-4" strokeWidth={2.5} />
                        Descargar video
                      </button>
                    )}

                    {downloading === 'audio' ? (
                      <div className="col-span-full">
                        <ProgressBar percent={progress} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownload('audio')}
                        disabled={busy}
                        className={`flex items-center justify-center gap-2 bg-fuchsia-400 py-3 sm:py-3.5 px-4 text-xs sm:text-sm font-black uppercase hover:bg-fuchsia-300 ${BOX} ${PRESS}`}
                      >
                        <Headphones className="h-4 w-4" strokeWidth={2.5} />
                        Descargar audio (MP3)
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Opciones con Selector de Calidad (YouTube) */}
              {isYouTube && (
                <>
                  {videoInfo.video_qualities.length > 0 && (
                    <div className="flex flex-col gap-2 border-t-[3px] border-black pt-3 sm:pt-4">
                      <div className="flex items-center justify-between">
                        <span className="bg-black px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-black uppercase text-white">
                          📹 OPCIONES DE VIDEO
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold uppercase text-black/60">
                          SELECCIONA RESOLUCIÓN
                        </span>
                      </div>
                      <QualityPills
                        options={videoInfo.video_qualities.map((q) => ({
                          value: q.height,
                          label: q.label,
                          size: q.size,
                        }))}
                        selected={selectedHeight}
                        onSelect={setSelectedHeight}
                        disabled={busy}
                      />
                      {downloading === 'video' ? (
                        <ProgressBar percent={progress} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDownload('video')}
                          disabled={busy}
                          className={`mt-1 flex items-center justify-center gap-2 bg-lime-300 py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-black uppercase hover:bg-lime-200 ${BOX} ${PRESS}`}
                        >
                          <Film className="h-4 w-4" strokeWidth={2.5} />
                          Descargar video
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 border-t-[3px] border-black pt-3 sm:pt-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-black px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-black uppercase text-white">
                        🎧 OPCIONES DE AUDIO
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold uppercase text-black/60">
                        SELECCIONA CALIDAD
                      </span>
                    </div>
                    <QualityPills
                      options={AUDIO_QUALITY_DEFS.map((a) => ({
                        value: a.value,
                        label: a.label,
                        size: videoInfo.audio_sizes?.[a.value],
                      }))}
                      selected={selectedAudioQuality}
                      onSelect={setSelectedAudioQuality}
                      disabled={busy}
                    />
                    {downloading === 'audio' ? (
                      <ProgressBar percent={progress} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownload('audio')}
                        disabled={busy}
                        className={`mt-1 flex items-center justify-center gap-2 bg-fuchsia-400 py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-black uppercase hover:bg-fuchsia-300 ${BOX} ${PRESS}`}
                      >
                        <Headphones className="h-4 w-4" strokeWidth={2.5} />
                        Descargar audio
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer Neo-Brutalista */}
      <footer className="w-full border-t-[3px] border-black bg-white py-4 sm:py-6 text-center text-[10px] sm:text-xs font-black uppercase">
        <div className="flex flex-col items-center justify-center gap-1.5 px-3 sm:flex-row sm:gap-6">
          <span>⚡ WEB TOOLS MEDIA DOWNLOADER</span>
          <span className="hidden sm:inline">•</span>
          <span>100% GRATIS & SIN ANUNCIOS</span>
          <span className="hidden sm:inline">•</span>
          <span>POWERED BY YT-DLP</span>
        </div>
      </footer>
    </div>
  )
}

export default App


