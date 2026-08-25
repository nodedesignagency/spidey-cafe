// The completion moment — the web twin of mobile/src/components/Celebration.js.
// Two things happen together, which is what makes it read as celebratory rather
// than decorative: a burst off the cup, and rings rippling outward. The rings
// double as the web reacting to the weight landing in it, so the celebration
// belongs to this screen specifically.

const RINGS = [
  { delay: 0, hue: 'rgba(60,44,33,0.7)', weight: 3 },
  { delay: 170, hue: 'rgba(60,44,33,0.5)', weight: 2.5 },
  { delay: 340, hue: 'rgba(60,44,33,0.32)', weight: 2 },
]

// Deterministic scatter: the same drink bursts the same way every time.
function scatter(seed, count) {
  let s = seed
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  return Array.from({ length: count }, (_, i) => {
    // Bias upward — things thrown off a cup go up before they fall.
    const angle = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.15
    const dist = 100 + rand() * 210
    return {
      key: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      fall: 45 + rand() * 130,
      size: 8 + rand() * 10,
      spin: (rand() - 0.5) * 540,
      round: rand() > 0.5,
      lead: rand() * 250,
    }
  })
}

export default function Celebration({ active, drink }) {
  if (!active) return null

  // Weighted to the light end of the drink's palette: the hero is a sunlit cream
  // wall and dark crumbs simply disappear into the cup and its shadow. The one
  // dark entry is what reads back against the wall.
  const palette = [drink.cream, '#FFFFFF', drink.liquid[0], drink.cream, drink.drizzle]
  const bits = scatter(drink.id.length * 7919 + drink.name.length, 26)

  return (
    <div className="burst" aria-hidden="true">
      {RINGS.map((r, i) => (
        <i
          key={`ring-${i}`}
          className="burst__ring"
          style={{ borderColor: r.hue, borderWidth: r.weight, animationDelay: `${r.delay}ms` }}
        />
      ))}

      {bits.map((b) => (
        <i
          key={`bit-${b.key}`}
          className={`burst__bit${b.round ? ' burst__bit--round' : ''}`}
          style={{
            background: palette[b.key % palette.length],
            width: b.size,
            height: b.round ? b.size : b.size * 0.6,
            animationDelay: `${b.lead}ms`,
            '--dx': `${b.dx}px`,
            '--dy': `${b.dy}px`,
            '--fall': `${b.fall}px`,
            '--spin': `${b.spin}deg`,
          }}
        />
      ))}

      {/* Rides the same beat and settles rather than fading out, so it is still
          there once the burst has cleared. Over the photo, not in a sheet. */}
      <span className="burst__pill">{drink.name} is ready</span>
    </div>
  )
}
