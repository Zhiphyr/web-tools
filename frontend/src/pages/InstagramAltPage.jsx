import { useState } from 'react'
import {
  AlertTriangle,
  Camera,
  ClipboardPaste,
  Download,
  ExternalLink,
  RotateCcw,
  X as XIcon,
  Zap,
  Shield,
  Film
} from 'lucide-react'
import { downloadInstagramMedia, getInstagramFallback } from '../lib/api'
import { BOX, PRESS, WIDTH, Spinner, ProgressBar, useBackendStatus, BackendStatusBanner } from '../components/shared'

const ALT_BADGES = [
  { Icon: Camera, text: 'SOLO REELS', rotate: '-rotate-1 sm:-rotate-2', className: 'bg-fuchsia-300' },
  { Icon: Zap, text: 'API RÁPIDA', rotate: 'rotate-1 sm:rotate-2', className: 'bg-yellow-300' },
  { Icon: Shield, text: '100% SEGURO', rotate: '-rotate-1 sm:-rotate-2', className: 'bg-cyan-300' },
]

const HOW_IT_WORKS_ALT = [
  {
    step: '01',
    title: 'COPIA EL LINK DEL REEL',
    desc: 'Copia el link de un Reel de Instagram.',
    bg: 'bg-fuchsia-300',
    Icon: ClipboardPaste,
  },
  {
    step: '02',
    title: 'CONSULTA LA API',
    desc: 'Nuestro backend utilizará una ruta alternativa para extraer la información.',
    bg: 'bg-yellow-300',
    Icon: Zap,
  },
  {
    step: '03',
    title: 'DESCARGA TU CONTENIDO',
    desc: 'Descarga instantánea de fotos o videos a máxima calidad disponible.',
    bg: 'bg-cyan-300',
    Icon: Film,
  },
]

function HowItWorksAlt() {
  return (
    <div className={`mt-8 sm:mt-10 flex flex-col ${WIDTH} gap-3 sm:gap-4`}>
      <div className="flex items-center gap-2">
        <span className="bg-black px-2.5 py-0.5 text-[11px] sm:text-xs font-black uppercase text-white">
          ✦ GUÍA RÁPIDA
        </span>
        <span className="text-[11px] sm:text-xs font-bold uppercase text-black/60">¿CÓMO FUNCIONA?</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {HOW_IT_WORKS_ALT.map((item) => (
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

export default function InstagramAltPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(null)
  const { status: backendStatus, checkingSlow, markAwake: markBackendAwake } = useBackendStatus()

  function handleClear() {
    setUrl('')
    setError(null)
    setResult(null)
  }

  async function handleDownload() {
    setDownloading(true)
    setProgress(null)
    setError(null)
    try {
      await downloadInstagramMedia(result.download_url, result.title, result.is_video, setProgress)
      markBackendAwake()
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(false)
      setProgress(null)
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text.trim())
      setError(null)
      setResult(null)
    } catch {
      setError('No se pudo leer el portapapeles. Revisá los permisos del navegador.')
    }
  }

  async function doSearch(targetUrl) {
    const trimmed = targetUrl.trim()
    if (!trimmed) return

    if (!/^https?:\/\//i.test(trimmed)) {
      setError('Ese link no parece válido. Tiene que empezar con http:// o https://')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await getInstagramFallback(trimmed)
      setResult(data)
      markBackendAwake()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    doSearch(url)
  }

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-3 flex justify-center text-center sm:mb-4">
        <BackendStatusBanner status={backendStatus} checkingSlow={checkingSlow} />
      </div>



      <h1
        className={`inline-flex items-center gap-2 -rotate-1 bg-fuchsia-400 px-4 py-2 sm:px-6 sm:py-3 text-xl sm:text-3xl text-center font-black uppercase tracking-tight ${BOX}`}
      >
        <Camera className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2.5} aria-hidden="true" />
        Instagram Alt
      </h1>

      <div className={`mt-4 sm:mt-6 flex ${WIDTH} flex-wrap justify-center gap-2 sm:gap-3`}>
        {ALT_BADGES.map((b) => (
          <span
            key={b.text}
            className={`flex items-center gap-1 sm:gap-1.5 border-[2.5px] sm:border-[3px] border-black px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase ${b.rotate} ${b.className} ${BOX}`}
          >
            <b.Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} aria-hidden="true" />
            {b.text}
          </span>
        ))}
      </div>



      <form onSubmit={handleSubmit} className={`mt-6 flex flex-col sm:flex-row ${WIDTH} gap-2.5 sm:gap-3`}>
        <div className="relative w-full sm:flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="PEGÁ EL LINK DEL REEL DE INSTAGRAM"
            className={`w-full bg-white py-3 pl-3.5 pr-11 text-xs sm:text-sm font-bold placeholder:font-normal placeholder:text-black/40 focus:outline-none ${BOX}`}
          />
          {url && (
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
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
            disabled={loading}
            className={`flex flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap bg-cyan-300 px-3.5 sm:px-4 py-3 text-xs sm:text-sm font-black uppercase hover:bg-cyan-200 ${BOX} ${PRESS}`}
          >
            <ClipboardPaste className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            Pegar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex flex-1 sm:w-36 items-center justify-center whitespace-nowrap bg-fuchsia-400 px-4 sm:px-6 py-3 text-xs sm:text-sm font-black uppercase hover:bg-fuchsia-300 ${BOX} ${PRESS}`}
          >
            {loading ? <Spinner /> : 'Buscar'}
          </button>
        </div>
      </form>

      {loading && (
        <div className={`mt-6 sm:mt-8 flex ${WIDTH} items-center justify-center gap-3 bg-white p-6 sm:p-8 ${BOX}`}>
          <Spinner className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="font-black uppercase text-xs sm:text-base">Consultando API alternativa...</span>
        </div>
      )}

      {!loading && error && (
        <div className={`mt-6 sm:mt-8 ${WIDTH} overflow-hidden ${BOX}`}>
          <div className="flex items-center gap-2 bg-black px-3 sm:px-4 py-2">
            <AlertTriangle className="h-4 w-4 text-white" strokeWidth={2.5} aria-hidden="true" />
            <span className="font-black uppercase text-xs sm:text-sm text-white">System Error</span>
          </div>
          <div className="bg-red-300 p-3 sm:p-4">
            <p className="font-bold text-xs sm:text-sm">{error}</p>
            <button
              type="button"
              onClick={() => doSearch(url)}
              className={`mt-3 bg-yellow-300 px-3 sm:px-4 py-2 text-xs sm:text-sm font-black uppercase hover:bg-yellow-200 ${BOX} ${PRESS}`}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!loading && !error && !result && <HowItWorksAlt />}

      {!loading && result && (
        <div className={`mt-6 sm:mt-8 flex flex-col gap-4 sm:gap-5 ${WIDTH} bg-white p-4 sm:p-5 ${BOX}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-black pb-3">
            <span className="border-[2px] border-black bg-lime-300 px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase">
              ✓ ENCONTRADO
            </span>
            <button
              type="button"
              onClick={handleClear}
              className={`flex items-center gap-1.5 bg-yellow-300 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase hover:bg-yellow-200 ${BOX} ${PRESS}`}
            >
              <RotateCcw className="h-3 w-3" strokeWidth={3} />
              Nueva Búsqueda
            </button>
          </div>

          <div className="w-full overflow-hidden border-[3px] border-black bg-black">
            {result.is_video ? (
              <video
                src={result.download_url}
                poster={result.thumbnail || undefined}
                controls
                preload="metadata"
                className="max-h-[70vh] w-full"
              />
            ) : (
              <img
                src={result.download_url || result.thumbnail}
                alt=""
                className="max-h-[70vh] w-full object-contain"
              />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h2 className="line-clamp-2 text-sm sm:text-base md:text-lg font-black uppercase leading-tight">
              {result.title}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="border-[2px] border-black bg-black px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase text-white">
                {result.is_video ? 'Video' : 'Imagen'}
              </span>
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

          {downloading ? (
            <ProgressBar percent={progress} />
          ) : (
            <button
              type="button"
              onClick={handleDownload}
              className={`flex items-center justify-center gap-2 bg-lime-300 py-3 sm:py-3.5 px-4 text-xs sm:text-sm font-black uppercase hover:bg-lime-200 ${BOX} ${PRESS}`}
            >
              <Download className="h-4 w-4" strokeWidth={2.5} />
              Descargar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
