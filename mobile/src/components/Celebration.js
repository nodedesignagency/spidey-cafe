import { useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'

// The completion moment. Two things happen together, which is what makes the
// reference read as celebratory rather than decorative: a burst off the cup, and
// rings rippling outward. Here the rings double as the web reacting to the
// weight landing in it, so the celebration belongs to this screen specifically.
//
// Everything is interpolated off a single driver so twenty-odd views cost one
// animation, and it all runs on the native driver.

// Dark, not white: the hero is a cream-coloured wall, so white rings were only
// visible for the fraction of their arc that crossed the cup.
const RINGS = [
  { delay: 0.0, hue: 'rgba(60,44,33,0.7)', weight: 3 },
  { delay: 0.12, hue: 'rgba(60,44,33,0.5)', weight: 2.5 },
  { delay: 0.24, hue: 'rgba(60,44,33,0.32)', weight: 2 },
]

// Deterministic scatter: the same drink bursts the same way every time.
function scatter(seed, count) {
  let s = seed
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  return Array.from({ length: count }, (_, i) => {
    // Bias upward - things thrown off a cup go up before they fall.
    const angle = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.15
    // Sized and thrown for a full-screen hero. At the old behind-the-sheet
    // height these were half this far and half this big, which on the whole
    // screen read as a handful of crumbs rather than as the drink landing.
    const dist = 100 + rand() * 210
    return {
      key: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      fall: 45 + rand() * 130,
      size: 8 + rand() * 10,
      spin: (rand() - 0.5) * 540,
      round: rand() > 0.5,
      lead: rand() * 0.18,
    }
  })
}

export default function Celebration({ active, drink, width, cy, span, bottom }) {
  const t = useRef(new Animated.Value(0)).current

  const bits = useMemo(() => {
    // Weighted to the light end of the drink's palette: the hero is a sunlit
    // cream wall and dark crumbs simply disappeared into the cup and its shadow.
    // The one dark entry is what reads back against the wall.
    const palette = [drink.cream, '#FFFFFF', drink.liquid[0], drink.cream, drink.drizzle]
    return scatter(drink.id.length * 7919 + drink.name.length, 26).map((b) => ({
      ...b,
      color: palette[b.key % palette.length],
    }))
  }, [drink])

  useEffect(() => {
    if (!active) {
      t.setValue(0)
      return
    }
    t.setValue(0)
    Animated.timing(t, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [active, t])

  if (!active) return null

  // The cup's centre and the space to ripple through are passed in: the hero is
  // full-bleed by the time this fires, so they no longer follow from the
  // behind-the-sheet height this used to be measured against.
  const cx = width / 2
  const ringSize = span * 0.5

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {RINGS.map((r, i) => (
        <Animated.View
          key={`ring-${i}`}
          style={{
            position: 'absolute',
            left: cx - ringSize / 2,
            top: cy - ringSize / 2,
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: r.weight,
            borderColor: r.hue,
            opacity: t.interpolate({
              inputRange: [r.delay, r.delay + 0.08, r.delay + 0.55].map((v) => Math.min(v, 1)),
              outputRange: [0, 0.95, 0],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: t.interpolate({
                  inputRange: [r.delay, Math.min(r.delay + 0.6, 1)],
                  outputRange: [0.15, 2.3],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}
        />
      ))}

      {bits.map((b) => (
        <Animated.View
          key={`bit-${b.key}`}
          style={{
            position: 'absolute',
            left: cx - b.size / 2,
            top: cy - b.size / 2,
            width: b.size,
            height: b.size * (b.round ? 1 : 0.6),
            borderRadius: b.round ? b.size : 1.5,
            backgroundColor: b.color,
            opacity: t.interpolate({
              inputRange: [b.lead, b.lead + 0.06, 0.62, 0.92],
              outputRange: [0, 1, 1, 0],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateX: t.interpolate({
                  inputRange: [b.lead, 1],
                  outputRange: [0, b.dx],
                  extrapolate: 'clamp',
                }),
              },
              {
                // Out and up, then gravity takes over.
                translateY: t.interpolate({
                  inputRange: [b.lead, Math.min(b.lead + 0.45, 0.99), 1],
                  outputRange: [0, b.dy, b.dy + b.fall],
                  extrapolate: 'clamp',
                }),
              },
              {
                rotate: t.interpolate({
                  inputRange: [b.lead, 1],
                  outputRange: ['0deg', `${b.spin}deg`],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}
        />
      ))}

      {/* The message rides the same driver and settles rather than fading out,
          so it is still there once the burst has cleared. Over the photo, not in
          a sheet. */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom,
          alignItems: 'center',
          opacity: t.interpolate({
            inputRange: [0.2, 0.38],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
          transform: [
            {
              translateY: t.interpolate({
                inputRange: [0.2, 0.44],
                outputRange: [14, 0],
                extrapolate: 'clamp',
              }),
            },
            {
              scale: t.interpolate({
                inputRange: [0.2, 0.44, 0.54],
                outputRange: [0.86, 1.05, 1],
                extrapolate: 'clamp',
              }),
            },
          ],
        }}
      >
        <View style={styles.pill}>
          <Text style={styles.pill__text}>{drink.name} is ready</Text>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(28, 18, 12, 0.78)',
  },
  pill__text: { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.1 },
})
