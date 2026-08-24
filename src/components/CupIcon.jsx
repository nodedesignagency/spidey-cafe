// Vector cup used in the carousel. Colours come from the drink so every item
// reads differently without needing a generated image per drink.
export default function CupIcon({ drink, size = 200 }) {
  const { id, liquid, cream, drizzle } = drink
  const gid = `liq-${id}`

  return (
    <svg
      width={size}
      height={size * 1.32}
      viewBox="0 0 200 264"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={liquid[0]} />
          <stop offset="100%" stopColor={liquid[1]} />
        </linearGradient>
      </defs>

      {/* straw */}
      <path d="M118 18 L104 74" stroke="#3F7D55" strokeWidth="11" strokeLinecap="round" />

      {/* whipped cream */}
      <path d="M60 78 C60 52 84 38 100 38 C116 38 140 52 140 78 Z" fill={cream} />
      <path
        d="M74 62 C80 48 92 44 100 44 C108 44 120 48 126 62"
        stroke={drizzle}
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.5"
        fill="none"
      />

      {/* cup body */}
      <path
        d="M56 78 H144 L132 236 C131 246 124 252 114 252 H86 C76 252 69 246 68 236 Z"
        fill={`url(#${gid})`}
      />

      {/* rim */}
      <rect x="52" y="70" width="96" height="16" rx="8" fill={cream} opacity="0.95" />

      {/* web roundel badge */}
      <g transform="translate(100 168)" opacity="0.92">
        <circle r="30" fill="#F6F1E7" />
        <circle r="30" fill="none" stroke={drizzle} strokeWidth="2.5" opacity="0.35" />
        <g stroke={drizzle} strokeWidth="1.9" fill="none" opacity="0.75">
          <path d="M0 -24 V24 M-24 0 H24 M-17 -17 L17 17 M17 -17 L-17 17" />
          <circle r="9" />
          <circle r="17" />
        </g>
      </g>

      {/* highlight */}
      <path d="M72 96 L66 226" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" opacity="0.18" />
    </svg>
  )
}
