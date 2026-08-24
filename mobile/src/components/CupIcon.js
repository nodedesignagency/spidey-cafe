import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg'

// Same cup as the web build, redrawn with react-native-svg. Colours come from
// the drink, so a new drink costs no image generation.
export default function CupIcon({ drink, size }) {
  const { id, liquid, cream, drizzle } = drink
  const gid = `liq-${id}`

  return (
    <Svg width={size} height={size * 1.32} viewBox="0 0 200 264">
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={liquid[0]} />
          <Stop offset="100%" stopColor={liquid[1]} />
        </LinearGradient>
      </Defs>

      <Path d="M118 18 L104 74" stroke="#3F7D55" strokeWidth="11" strokeLinecap="round" />

      <Path d="M60 78 C60 52 84 38 100 38 C116 38 140 52 140 78 Z" fill={cream} />
      <Path
        d="M74 62 C80 48 92 44 100 44 C108 44 120 48 126 62"
        stroke={drizzle}
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.5"
        fill="none"
      />

      <Path
        d="M56 78 H144 L132 236 C131 246 124 252 114 252 H86 C76 252 69 246 68 236 Z"
        fill={`url(#${gid})`}
      />

      <Rect x="52" y="70" width="96" height="16" rx="8" fill={cream} opacity="0.95" />

      <G x="100" y="168" opacity="0.92">
        <Circle r="30" fill="#F6F1E7" />
        <Circle r="30" fill="none" stroke={drizzle} strokeWidth="2.5" opacity="0.35" />
        <G stroke={drizzle} strokeWidth="1.9" fill="none" opacity="0.75">
          <Path d="M0 -24 V24 M-24 0 H24 M-17 -17 L17 17 M17 -17 L-17 17" />
          <Circle r="9" />
          <Circle r="17" />
        </G>
      </G>

      <Path d="M72 96 L66 226" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" opacity="0.18" />
    </Svg>
  )
}
