/**
 * SVG illustrations keyed by product slug.
 * Completely decoupled from the product data model —
 * when products load from Supabase, the slug is used to look up the illustration here.
 */

const stroke = 'rgba(168,149,111,0.5)'
const sw     = '1.5'

const illustrations = {
  'lune-vase': (
    <svg viewBox="0 0 120 180" fill="none" stroke={stroke} strokeWidth={sw}>
      <path d="M40 20 Q60 10 80 20 Q100 140 90 160 Q75 175 60 175 Q45 175 30 160 Q20 140 40 20Z"/>
      <ellipse cx="60" cy="20" rx="22" ry="8"/>
    </svg>
  ),
  'arch-stand': (
    <svg viewBox="0 0 120 180" fill="none" stroke={stroke} strokeWidth={sw}>
      <path d="M60 20 Q90 20 90 60 Q90 100 60 160 Q30 100 30 60 Q30 20 60 20Z"/>
      <line x1="60" y1="160" x2="20" y2="175"/>
      <line x1="60" y1="160" x2="100" y2="175"/>
    </svg>
  ),
  'duo-statue': (
    <svg viewBox="0 0 120 180" fill="none" stroke={stroke} strokeWidth={sw}>
      <circle cx="45" cy="30" r="18"/>
      <circle cx="75" cy="35" r="16"/>
      <path d="M20 180 Q30 100 45 80 Q55 100 70 180"/>
      <path d="M50 180 Q65 100 75 80 Q85 100 100 180"/>
      <line x1="20" y1="180" x2="100" y2="180"/>
    </svg>
  ),
  'wave-vase': (
    <svg viewBox="0 0 120 180" fill="none" stroke={stroke} strokeWidth={sw}>
      <path d="M35 20 Q45 40 35 60 Q45 80 35 100 Q45 120 35 140 Q42 165 60 170 Q78 165 85 140 Q75 120 85 100 Q75 80 85 60 Q75 40 85 20Z"/>
      <ellipse cx="60" cy="20" rx="26" ry="8"/>
    </svg>
  ),
  'facet-holder': (
    <svg viewBox="0 0 120 180" fill="none" stroke={stroke} strokeWidth={sw}>
      <polygon points="60,15 100,40 100,130 60,155 20,130 20,40"/>
      <polygon points="60,15 100,40 60,65 20,40"/>
      <line x1="60" y1="65" x2="60" y2="155"/>
    </svg>
  ),
  'luna-light': (
    <svg viewBox="0 0 120 180" fill="none" stroke={stroke} strokeWidth={sw}>
      <circle cx="60" cy="80" r="50"/>
      <path d="M60 30 Q85 55 75 80 Q65 105 60 130 Q55 105 45 80 Q35 55 60 30Z" fill="rgba(168,149,111,0.15)"/>
    </svg>
  ),
  'ridge-planter': (
    <svg viewBox="0 0 120 180" fill="none" stroke={stroke} strokeWidth={sw}>
      <path d="M30 40 Q30 20 60 20 Q90 20 90 40 L85 155 Q85 170 60 170 Q35 170 35 155Z"/>
      <line x1="32" y1="70"  x2="88" y2="70"/>
      <line x1="30" y1="100" x2="90" y2="100"/>
      <line x1="32" y1="130" x2="88" y2="130"/>
    </svg>
  ),
  'column-candle': (
    <svg viewBox="0 0 120 180" fill="none" stroke={stroke} strokeWidth={sw}>
      <rect x="48" y="20" width="24" height="140" rx="2"/>
      <ellipse cx="60" cy="160" rx="28" ry="8"/>
      <rect x="44" y="16" width="32" height="8" rx="2"/>
    </svg>
  ),
}

// Fallback for unknown slugs
const Fallback = () => (
  <svg viewBox="0 0 120 180" fill="none" stroke={stroke} strokeWidth={sw}>
    <rect x="30" y="20" width="60" height="140" rx="4"/>
  </svg>
)

export default function ProductIllustration({ slug, className, style }) {
  const Illustration = illustrations[slug]
  return (
    <span className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', ...style }}>
      {Illustration
        ? <span style={{ width: 80, height: 120 }}>{Illustration}</span>
        : <Fallback />
      }
    </span>
  )
}
