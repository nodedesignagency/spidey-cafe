import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useVideoPlayer, VideoView } from 'expo-video'

import { drinks, DEFAULT_INDEX } from './src/data/drinks'
import DrinkCarousel from './src/components/DrinkCarousel'
import Celebration from './src/components/Celebration'
import EdgeGlow from './src/components/EdgeGlow'
import PourBar from './src/components/PourBar'
import { motion, scale, spec, theme } from './src/theme'

// The clip runs 5.08s at normal speed, which reads as rushed for something the
// whole screen is watching, so it plays slower.
const PLAYBACK_RATE = 0.8
const CLIP_SECONDS = 5.08
// The drink is visually finished about 80% of the way through the clip; the rest
// is the completed cup just sitting there. Ending on that beat is why the bar
// now fills exactly as the pour completes instead of running on into dead frames.
const END_AT = 0.82
const POUR_MS = Math.round(((CLIP_SECONDS * END_AT) / PLAYBACK_RATE) * 1000)

const EMPTY = require('./assets/cup-empty.jpg')
const FILLED = require('./assets/cup-filled.jpg')
const POUR = require('./assets/pour.mp4')

// Every value here drives a layout-affecting style - a height, or a width
// percentage - so they all run off the JS driver. Mixing the two is what let the
// sheet and the photo drift apart part-way through the collapse.
const anim = (value, toValue, duration, easing) =>
  Animated.timing(value, { toValue, duration, easing, useNativeDriver: false })

export default function App() {
  const { width, height } = useWindowDimensions()
  const s = scale(width)
  // No safe-area inset added: the frame already positions the CTA 20pt off the
  // bottom of the screen, which clears the home indicator. Adding the inset on
  // top of that was what left a band of white under the button.
  const sheetH = spec.sheetH * s
  // Where the hero is framed while the sheet is up: it runs under the sheet's
  // rounded corners so the photo shows through them. Once the sheet drops the
  // stills re-frame from this to the full screen.
  const heroH = height - sheetH + spec.sheetRadius * s

  const [index, setIndex] = useState(DEFAULT_INDEX)
  const [phase, setPhase] = useState('idle') // idle | pouring | ready | taken
  // Mirrors `phase` for the guards below. The swipe effect and the timers all
  // fire outside the render that created them, so reading the state variable
  // there gives whatever it was at the time - which is how the app could jump
  // to 'ready' while sitting idle.
  const phaseRef = useRef('idle')
  // Which ingredient is showing, rather than raw progress: this is state, and
  // storing a number that changes every tick re-rendered the whole screen -
  // carousel included - dozens of times per pour. It changes ~4 times instead.
  const [stepIdx, setStepIdx] = useState(0)
  // Only hide the still once the clip is genuinely rendering, so a playback
  // failure leaves the photo up rather than an empty hero.
  const [videoLive, setVideoLive] = useState(false)
  // True once the hero has finished opening to full screen. Nothing about the
  // pour starts before this: the video is framed full-bleed from the outset, so
  // revealing it while the stills were still re-framing put a hard cut in the
  // middle of the collapse.
  const [expanded, setExpanded] = useState(false)
  const fallbackRef = useRef(null)
  const takenRef = useRef(null)

  const drink = drinks[index]
  // Read inside the poll so the interval never has to list `drink` as a
  // dependency; doing so restarted playback mid-pour whenever you swiped.
  const drinkRef = useRef(drink)
  drinkRef.current = drink

  const goTo = useCallback((next) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const player = useVideoPlayer(POUR, (p) => {
    p.muted = true
    p.loop = false
    p.playbackRate = PLAYBACK_RATE
  })

  const sweep = useRef(new Animated.Value(0)).current
  // 1 = sheet sitting up, 0 = collapsed off the bottom.
  const open = useRef(new Animated.Value(1)).current
  // 0 = hero framed above the sheet, 1 = hero filling the screen.
  const bleed = useRef(new Animated.Value(0)).current
  const glow = useRef(new Animated.Value(0)).current
  const startedAt = useRef(0)

  // Guarded: both the fallback timer and the player's playToEnd listener can
  // fire when nothing is pouring, and without this they dragged the whole screen
  // into 'ready' - a finished drink appearing mid-swipe.
  const finish = useCallback(() => {
    clearTimeout(fallbackRef.current)
    if (phaseRef.current !== 'pouring') return
    try {
      player.pause() // nothing left worth showing; stop it under the still
    } catch {
      /* not ready; nothing to stop */
    }
    setVideoLive(false)
    setStepIdx(0)
    anim(glow, 0.5, 420, Easing.out(Easing.quad)).start()
    goTo('ready')
  }, [player, glow, goTo])

  // The clip ending is a backstop now that the pour ends early on END_AT.
  useEffect(() => {
    if (!player?.addListener) return undefined
    const ended = player.addListener('playToEnd', () => finish())
    return () => ended?.remove?.()
  }, [player, finish])

  // Playback starts once the hero has finished opening, not on the tap: the
  // handler runs a render earlier than the pour state, and the collapse needs
  // the screen to itself before the clip is worth showing.
  useEffect(() => {
    if (phase !== 'pouring' || !expanded) return undefined
    try {
      player.currentTime = 0
    } catch {
      /* not loaded yet; it starts from zero anyway */
    }
    try {
      player.playbackRate = PLAYBACK_RATE
      player.play()
    } catch {
      /* fall through to the fallback timer below */
    }
    startedAt.current = Date.now()
    // Guarantees the flow reaches 'ready' even if the clip never renders.
    fallbackRef.current = setTimeout(finish, POUR_MS + 350)

    const id = setInterval(() => {
      let live = false
      let p = 0
      try {
        live = player.status === 'readyToPlay' && player.playing === true
        const d = player.duration
        // Progress through the clip itself, so slowing playback slows the chips
        // with it. Wall-clock is only the fallback when nothing is rendering,
        // scaled to END_AT so both paths finish on the same number.
        if (live && d > 0) p = player.currentTime / d
        else p = ((Date.now() - startedAt.current) / POUR_MS) * END_AT
      } catch {
        p = ((Date.now() - startedAt.current) / POUR_MS) * END_AT
      }
      const raw = Math.max(0, Math.min(1, p))
      setVideoLive(live)

      // Ingredient `at` values are fractions of the whole clip, so they read raw.
      let next = 0
      drinkRef.current.ingredients.forEach((ing, i) => {
        if (raw >= ing.at) next = i
      })
      setStepIdx((cur) => (cur === next ? cur : next))

      // The bar spans up to END_AT, so it reaches full exactly as the pour does.
      anim(sweep, Math.min(1, raw / END_AT), 130, Easing.linear).start()

      if (raw >= END_AT) finish()
    }, 120)

    return () => {
      clearInterval(id)
      clearTimeout(fallbackRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, expanded, player, sweep, finish])

  const reset = useCallback(() => {
    clearTimeout(fallbackRef.current)
    clearTimeout(takenRef.current)
    try {
      player.pause()
      player.currentTime = 0
    } catch {
      /* player may not be ready yet */
    }
    setVideoLive(false)
    setStepIdx(0)
    setExpanded(false)

    // Cancelling mid-pour has nothing left worth looking at, so the screen drops
    // back immediately. Finishing a drink keeps the bar and the photo up until
    // the sheet has risen over them, so the last thing you see is the drink.
    const cancelled = phaseRef.current === 'pouring'
    if (cancelled) {
      sweep.setValue(0)
      goTo('idle')
    }

    Animated.parallel([
      anim(open, 1, motion.restore, Easing.out(Easing.cubic)),
      anim(bleed, 0, motion.restore, Easing.inOut(Easing.cubic)),
      anim(glow, 0, motion.restore * 0.7, Easing.in(Easing.quad)),
    ]).start(() => {
      if (cancelled || phaseRef.current === 'idle') return
      sweep.setValue(0)
      goTo('idle')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, open, bleed, glow, sweep, goTo])

  const pour = () => {
    if (phase === 'pouring' || phase === 'taken') return
    if (phase === 'ready') {
      // Acknowledge the tap before clearing. Previously this reset straight to
      // idle, so taking the drink looked identical to nothing happening.
      goTo('taken')
      takenRef.current = setTimeout(reset, 1400)
      return
    }
    goTo('pouring')
    sweep.setValue(0)
    setExpanded(false)
    // The sheet shrinks away faster than the photo opens, so the hero is still
    // settling once the white has gone.
    Animated.parallel([
      anim(open, 0, motion.collapse, Easing.bezier(0.4, 0.02, 0.2, 1)),
      anim(bleed, 1, motion.bleed, Easing.out(Easing.cubic)),
      anim(glow, 1, motion.bleed, Easing.out(Easing.quad)),
    ]).start(({ finished }) => finished && setExpanded(true))
  }

  // Changing your mind mid-pour rewinds the whole thing. Reads the ref, not the
  // state, so a swipe can never leave a stale pour timer running behind it, and
  // keys on `index` alone so a new `reset` identity cannot trip it on its own.
  const resetRef = useRef(reset)
  resetRef.current = reset
  useEffect(() => {
    if (phaseRef.current !== 'idle') resetRef.current()
  }, [index])

  useEffect(
    () => () => {
      clearTimeout(fallbackRef.current)
      clearTimeout(takenRef.current)
    },
    [],
  )

  const heroFrame = bleed.interpolate({ inputRange: [0, 1], outputRange: [heroH, height] })
  // One geometry for the sheet's CTA and the floating bar, ring included, so the
  // handover across the collapse lands on the same pixels.
  const barBottom = spec.ctaBottom * s
  const barH = spec.ctaH * s
  const barW = spec.ctaW * s
  const barRadius = spec.ctaRadius * s
  const ringW = spec.ctaRing * s

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.hero}>
        {/* The video stays mounted for the whole session and sits underneath, at
            the size it will be shown at - full screen. Mounting it only for the
            pour gave a player that reported readyToPlay/playing but drew nothing;
            resizing it mid-pour risks the same, so the stills do the re-framing
            and the video simply waits behind them until they have caught up. */}
        <VideoView
          player={player}
          style={{ position: 'absolute', top: 0, left: 0, width, height }}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Both stills stay mounted and are toggled by opacity. Swapping one
            Image's source instead makes it reload, which showed as a flash at
            the moment the pour finished. Their height is what re-frames the hero:
            growing the box re-runs the cover crop, so the cup swells into the
            space the sheet leaves rather than being scaled up out of it. */}
        <Animated.Image
          source={EMPTY}
          style={[
            styles.still,
            { width, height: heroFrame },
            (phase === 'ready' ||
              phase === 'taken' ||
              (phase === 'pouring' && expanded && videoLive)) && { opacity: 0 },
          ]}
          resizeMode="cover"
        />
        <Animated.Image
          source={FILLED}
          style={[
            styles.still,
            { width, height: heroFrame },
            phase !== 'ready' && phase !== 'taken' && { opacity: 0 },
          ]}
          resizeMode="cover"
        />

        <EdgeGlow
          width={width}
          height={height}
          color={drink.drizzle}
          opacity={Animated.multiply(
            glow,
            sweep.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
          )}
        />

        <Celebration
          active={phase === 'ready' || phase === 'taken'}
          drink={drink}
          width={width}
          cy={height * 0.5}
          span={width}
          bottom={barBottom + barH + 22 * s}
        />
      </View>

      <Animated.View
        pointerEvents={phase === 'idle' ? 'auto' : 'none'}
        style={[
          styles.sheet,
          {
            height: sheetH,
            borderTopLeftRadius: spec.sheetRadius * s,
            borderTopRightRadius: spec.sheetRadius * s,
            opacity: open.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
            transform: [
              {
                translateY: open.interpolate({
                  inputRange: [0, 1],
                  outputRange: [sheetH * 1.02, 0],
                }),
              },
              { scale: open.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) },
            ],
          },
        ]}
      >
        <Text style={[styles.title, { top: spec.titleTop * s, fontSize: spec.titleSize * s }]}>
          What are we swinging today?
        </Text>

        <View style={[styles.carousel, { top: spec.carouselTop * s }]}>
          <DrinkCarousel
            drinks={drinks}
            index={index}
            onIndex={setIndex}
            disabled={phase !== 'idle'}
          />
        </View>

        <Text style={[styles.name, { top: spec.nameTop * s, fontSize: spec.nameSize * s }]}>
          {drink.name}
        </Text>

        {/* Sits at the exact coordinates PourBar takes over, in the same ink at
            the same size, so the handover across the collapse is invisible: the
            button appears to stay put while the sheet falls away behind it. It
            carries the ring too - white on white, so it costs nothing here and
            is already in place when the photo arrives behind it. */}
        <Pressable
          onPress={pour}
          disabled={phase !== 'idle'}
          style={[
            styles.ctaRing,
            {
              width: barW + ringW * 2,
              height: barH + ringW * 2,
              borderRadius: barRadius + ringW,
              bottom: barBottom - ringW,
              marginLeft: -(barW + ringW * 2) / 2,
              padding: ringW,
            },
          ]}
        >
          {({ pressed }) => (
            <View
              style={[
                styles.ctaPill,
                { width: barW, height: barH, borderRadius: barRadius },
                pressed && { backgroundColor: theme.ctaPress },
              ]}
            >
              <Text style={[styles.ctaText, { fontSize: spec.ctaTextSize * s }]} numberOfLines={1}>
                Spin it up
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {phase !== 'idle' && (
        <PourBar
          phase={phase}
          ingredient={drink.ingredients[stepIdx]}
          sweep={sweep}
          onPress={pour}
          width={barW}
          height={barH}
          radius={barRadius}
          ring={ringW}
          bottom={barBottom}
          fontSize={spec.ctaTextSize * s}
          pourFontSize={spec.pourTextSize * s}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.backdrop },

  hero: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.heroFallback },
  still: { position: 'absolute', top: 0, left: 0 },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.sheet,
    overflow: 'hidden',
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontWeight: '500',
    color: theme.ink,
  },
  carousel: { position: 'absolute', left: 0, right: 0 },
  name: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontWeight: '400',
    color: theme.ink,
  },

  ctaRing: {
    position: 'absolute',
    left: '50%',
    backgroundColor: theme.ctaRing,
  },
  ctaPill: {
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaText: { color: '#fff', fontWeight: '500' },
})
