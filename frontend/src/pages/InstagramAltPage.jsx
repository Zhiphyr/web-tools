import { useState } from 'react'
import {
  AlertTriangle,
  Camera,
  ClipboardPaste,
  Download,
  ExternalLink,
  Info,
  RotateCcw,
  X as XIcon,
} from 'lucide-react'
import { getInstagramFallback } from '../lib/api'
import { BOX, PRESS, WIDTH, Spinner } from '../components/shared'

export default function InstagramAltPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  function handleClear() {
    setUrl('')
    setError(null)
    setResult(null)
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
      <div className={`mb-4 flex ${WIDTH} items-center gap-2 border-[2.5px] sm:border-[3px] border-black bg-fuchsia-300 px-3 py-2`}>
        <Info className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        <p className="text-[11px] sm:text-xs font-black uppercase leading-snug">
          API alternativa para Instagram · Límite: 10 consultas por día
        </p>
      </div>

      <h1
        className={`inline-flex items-center gap-2 -rotate-1 bg-fuchsia-400 px-4 py-2 sm:px-6 sm:py-3 text-xl sm:text-3xl text-center font-black uppercase tracking-tight ${BOX}`}
      >
        <Camera className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2.5} aria-hidden="true" />
        Instagram Alt
      </h1>

      <p className={`mt-4 ${WIDTH} text-center text-xs sm:text-sm font-bold text-black/70`}>
        Usá esta opción si el buscador principal te devuelve un error de límite de peticiones
        (rate limit) al descargar de Instagram.
      </p>

      <form onSubmit={handleSubmit} className={`mt-6 flex flex-col sm:flex-row ${WIDTH} gap-2.5 sm:gap-3`}>
        <div className="relative w-full sm:flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="PEGÁ EL LINK DE INSTAGRAM (REEL, POST, ETC.)"
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {result.thumbnail && (
              <div className="relative w-full shrink-0 overflow-hidden border-[3px] border-black bg-black sm:w-44">
                <img
                  src={result.thumbnail}
                  alt=""
                  className="aspect-video w-full object-cover sm:h-28"
                  onError={(e) => {
                    e.currentTarget.parentElement.style.display = 'none'
                  }}
                />
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
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
          </div>

          <a
            href={result.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 bg-lime-300 py-3 sm:py-3.5 px-4 text-xs sm:text-sm font-black uppercase hover:bg-lime-200 ${BOX} ${PRESS}`}
          >
            <Download className="h-4 w-4" strokeWidth={2.5} />
            Descargar
          </a>
        </div>
      )}
    </div>
  )
}
