import { useState } from 'react'
import {
  AlertTriangle,
  Camera,
  Clock,
  ClipboardPaste,
  Music2,
  Play,
  Rocket,
  Shield,
  User,
  X as XIcon,
  Zap,
} from 'lucide-react'
import { downloadAudio, downloadVideo, getVideoInfo } from './lib/api'

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
      <p className="mt-2 text-center font-black uppercase">
        {indeterminate ? 'Descargando...' : `${percent}% Descargando...`}
      </p>
    </div>
  )
}

function QualityPills({ options, selected, onSelect, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            disabled={disabled}
            className={`border-[3px] border-black px-3 py-1.5 text-xs font-black uppercase transition-colors disabled:opacity-50 disabled:pointer-events-none ${
              isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
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
    <span className="flex items-center gap-8 pr-8">
      {MARQUEE_ITEMS.map((item, i) => (
        <span key={i} className="flex items-center gap-8">
          <span>{item}</span>
          <span aria-hidden="true">✦</span>
        </span>
      ))}
    </span>
  )
  return (
    <div className="w-full overflow-hidden border-b-[3px] border-black bg-black py-2 text-white">
      <div className="marquee-track flex w-max whitespace-nowrap text-sm font-black uppercase tracking-wide">
        {track}
        {track}
      </div>
    </div>
  )
}

const BOX = 'border-[3px] border-black shadow-[6px_6px_0_0_#000]'
const PRESS =
  'transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] disabled:opacity-50 disabled:pointer-events-none'
const WIDTH = 'w-full max-w-2xl'

const PLATFORMS = [
  { label: 'YouTube', Icon: Play, className: 'bg-red-400' },
  { label: 'Instagram', Icon: Camera, className: 'bg-fuchsia-400' },
  { label: 'TikTok', Icon: Music2, className: 'bg-cyan-300' },
  { label: 'X / Twitter', Icon: XIcon, className: 'bg-white' },
]

const BADGES = [
  { Icon: Zap, text: '100% GRATIS & SIN LÍMITES', rotate: '-rotate-2', className: 'bg-yellow-300' },
  { Icon: Shield, text: 'SIN MARCA DE AGUA', rotate: 'rotate-2', className: 'bg-cyan-300' },
  { Icon: Rocket, text: 'ALTA VELOCIDAD', rotate: '-rotate-2', className: 'bg-lime-300' },
]

const AUDIO_QUALITY_DEFS = [
  { value: '320', label: 'MP3 320K' },
  { value: '128', label: 'MP3 128K' },
  { value: 'wav', label: 'WAV' },
]

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
    } catch (err) {
      setError(err.message)
      setErrorStatus(err.cause?.status ?? null)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    doSearch(url)
  }

  const isYouTube = videoInfo?.extractor?.toLowerCase().includes('youtube') ?? false

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
    } catch (err) {
      setError(err.message)
      setErrorStatus(err.cause?.status ?? null)
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
    <div className="flex min-h-screen flex-col items-center text-black">
      <Marquee />

      <div className="flex w-full flex-col items-center px-4 py-16">
        <h1
          className={`inline-block -rotate-1 bg-yellow-300 px-6 py-3 text-3xl font-black uppercase tracking-tight sm:text-4xl ${BOX}`}
        >
          Descargar video o audio
        </h1>

        <div className={`mt-6 flex ${WIDTH} flex-wrap justify-center gap-3`}>
          {BADGES.map((b) => (
            <span
              key={b.text}
              className={`flex items-center gap-1.5 border-[3px] border-black px-3 py-1.5 text-xs font-black uppercase ${b.rotate} ${b.className} ${BOX}`}
            >
              <b.Icon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
              {b.text}
            </span>
          ))}
        </div>

        <form onSubmit={handleSearch} className={`mt-8 flex flex-wrap ${WIDTH} gap-3`}>
          <div className="relative flex-1">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="PEGÁ EL LINK (YOUTUBE, TIKTOK, INSTAGRAM, X...)"
              className={`w-full bg-white py-3 pl-4 pr-12 font-bold placeholder:font-normal placeholder:text-black/40 focus:outline-none ${BOX}`}
            />
            {url && (
              <button
                type="button"
                onClick={handleClear}
                disabled={busy}
                aria-label="Limpiar"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center border-[3px] border-black bg-[#ff5c5c] hover:bg-[#ff7a7a] disabled:opacity-50"
              >
                <XIcon className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handlePaste}
            disabled={busy}
            className={`flex items-center gap-2 whitespace-nowrap bg-cyan-300 px-4 py-3 font-black uppercase hover:bg-cyan-200 ${BOX} ${PRESS}`}
          >
            <ClipboardPaste className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            Pegar
          </button>
          <button
            type="submit"
            disabled={busy}
            className={`flex w-36 items-center justify-center whitespace-nowrap bg-yellow-300 px-6 py-3 font-black uppercase hover:bg-yellow-200 ${BOX} ${PRESS}`}
          >
            {loading ? <Spinner /> : 'Buscar'}
          </button>
        </form>

        <div className={`mt-4 flex ${WIDTH} flex-wrap gap-2`}>
          {PLATFORMS.map((p) => (
            <span
              key={p.label}
              className={`flex items-center gap-1.5 border-[3px] border-black px-3 py-1 text-xs font-black uppercase ${p.className}`}
            >
              <p.Icon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
              {p.label}
            </span>
          ))}
        </div>

        {loading && (
          <div className={`mt-8 flex ${WIDTH} items-center justify-center gap-3 bg-white p-8 ${BOX}`}>
            <Spinner className="h-6 w-6" />
            <span className="font-black uppercase">Buscando...</span>
          </div>
        )}

        {!loading && error && (
          <div className={`mt-8 ${WIDTH} overflow-hidden ${BOX}`}>
            <div className="flex items-center gap-2 bg-black px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-white" strokeWidth={2.5} aria-hidden="true" />
              <span className="font-black uppercase text-white">
                System Error // {errorStatus ?? 'VALIDATION'}
              </span>
            </div>
            <div className="bg-red-300 px-4 py-4">
              <p className="font-bold">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className={`mt-3 bg-yellow-300 px-4 py-2 font-black uppercase hover:bg-yellow-200 ${BOX} ${PRESS}`}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!loading && videoInfo && (
          <div className={`mt-8 flex flex-col gap-5 ${WIDTH} bg-white p-5 ${BOX}`}>
            <div className="flex gap-5">
              {videoInfo.thumbnail && (
                <img
                  src={videoInfo.thumbnail}
                  alt=""
                  className="h-32 w-32 shrink-0 border-[3px] border-black object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <div className="flex min-w-0 flex-col justify-center gap-2">
                <p className="truncate font-black uppercase">{videoInfo.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {videoInfo.duration != null && (
                    <span className="flex items-center gap-1 bg-black px-2 py-0.5 text-xs font-bold uppercase text-white">
                      <Clock className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                      {formatDuration(videoInfo.duration)}
                    </span>
                  )}
                  {videoInfo.uploader && (
                    <span className="flex items-center gap-1 bg-yellow-300 px-2 py-0.5 text-xs font-bold uppercase text-black">
                      <User className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                      {videoInfo.uploader}
                    </span>
                  )}
                  <span className="bg-black px-2 py-0.5 text-xs font-bold uppercase text-white">
                    {videoInfo.extractor}
                  </span>
                </div>
              </div>
            </div>

            {videoInfo.video_qualities.length > 0 && (
              <div className="flex flex-col gap-2 border-t-[3px] border-black pt-4">
                <p className="text-xs font-black uppercase text-black/50">Video</p>
                {isYouTube && (
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
                )}
                {downloading === 'video' ? (
                  <ProgressBar percent={progress} />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDownload('video')}
                    disabled={busy}
                    className={`flex items-center justify-center gap-2 bg-lime-300 px-4 py-2 text-sm font-black uppercase hover:bg-lime-200 ${BOX} ${PRESS}`}
                  >
                    Descargar video
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t-[3px] border-black pt-4">
              <p className="text-xs font-black uppercase text-black/50">Audio</p>
              {isYouTube && (
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
              )}
              {downloading === 'audio' ? (
                <ProgressBar percent={progress} />
              ) : (
                <button
                  type="button"
                  onClick={() => handleDownload('audio')}
                  disabled={busy}
                  className={`flex items-center justify-center gap-2 bg-fuchsia-400 px-4 py-2 text-sm font-black uppercase hover:bg-fuchsia-300 ${BOX} ${PRESS}`}
                >
                  Descargar audio
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
