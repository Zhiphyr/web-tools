const MARQUEE_ITEMS = [
  'YOUTUBE TO MP3',
  'TIKTOK SIN MARCA DE AGUA',
  'INSTAGRAM REELS',
  'AUDIO EN HD',
]

export default function Marquee() {
  const track = (
    <span className="flex items-center gap-6 pr-6 sm:gap-8 sm:pr-8">
      {MARQUEE_ITEMS.map((item, i) => (
        <span key={i} className="flex items-center gap-6 sm:gap-8">
          <span>{item}</span>
          <span aria-hidden="true">✦</span>
        </span>
      ))}
    </span>
  )
  return (
    <div className="w-full overflow-hidden border-b-[3px] border-black bg-black py-1.5 text-white sm:py-2">
      <div className="marquee-track flex w-max whitespace-nowrap text-xs font-black uppercase tracking-wide sm:text-sm">
        {track}
        {track}
      </div>
    </div>
  )
}
