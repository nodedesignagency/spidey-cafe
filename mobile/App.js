import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Image,
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
import IngredientTicker from './src/components/IngredientTicker'
import { scale, spec, theme } from './src/theme'

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

export default function App() {
  const { width, height } = useWindowDimensions()
  const s = scale(width)
  // No safe-area inset added: the frame already positions the CTA 20pt off the
  // bottom of the screen, which clears the home indicator. Adding the inset on
  // top of that was what left a band of white under the button.
  const sheetH = spec.sheetH * s
  // The hero runs under the sheet's rounded corners so the photo shows through them.
  const heroH = height - sheetH + spec.sheetRadius * s

  const [index, setIndex] = useState(DEFAULT_INDEX)
  const [phase, setPhase] = useState('idle') // idle | pouring | ready
  // Which ingredient is showing, rather than raw progress: this is state, and
  // storing a number that changes every tick re-rendered the whole screen -
  // carousel included - dozens of times per pour. It changes ~4 times instead.
  const [stepIdx, setStepIdx] = useState(0)
  // Only hide the still once the clip is genuinely rendering, so a playback
  // failure leaves the photo up rather than an empty hero.
  const [videoLive, setVideoLive] = useState(false)
  const fallbackRef = useRef(null)

  const drink = drinks[index]

  const player = useVideoPlayer(POUR, (p) => {
    p.muted = true
    p.loop = false
    p.playbackRate = PLAYBACK_RATE
  })

  const sweep = useRef(new Animated.Value(0)).current
  const startedAt = useRef(0)

  const finish = useCallback(() => {
    clearTimeout(fallbackRef.current)
    try {
      player.pause() // nothing left worth showing; stop it under the still
    } catch {
      /* not ready; nothing to stop */
    }
    setVideoLive(false)
    setStepIdx(0)
    setPhase('ready')
  }, [player])

  // The clip ending is a backstop now that the pour ends early on END_AT.
  useEffect(() => {
    if (!player?.addListener) return undefined
    const ended = player.addListener('playToEnd', () => finish())
    return () => ended?.remove?.()
  }, [player, finish])

  // Start playback from an effect, not from the tap handler: the handler runs a
  // render earlier than the pour state, so play() was being called before the
  // view had been laid out for it.
  useEffect(() => {
    if (phase !== 'pouring') return undefined
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
      drink.ingredients.forEach((ing, i) => {
        if (raw >= ing.at) next = i
      })
      setStepIdx((cur) => (cur === next ? cur : next))

      // The bar spans up to END_AT, so it reaches full exactly as the pour does.
      // Animated drives the width natively, so this does not re-render anything.
      Animated.timing(sweep, {
        toValue: Math.min(1, raw / END_AT),
        duration: 130,
        useNativeDriver: false,
      }).start()

      if (raw >= END_AT) finish()
    }, 120)
    return () => clearInterval(id)
  }, [phase, player, sweep, drink, finish])

  const reset = useCallback(() => {
    clearTimeout(fallbackRef.current)
    try {
      player.pause()
      player.currentTime = 0
    } catch {
      /* player may not be ready yet */
    }
    sweep.setValue(0)
    setVideoLive(false)
    setStepIdx(0)
    setPhase('idle')
  }, [player, sweep])

  const pour = () => {
    if (phase === 'pouring') return
    if (phase === 'ready') {
      reset()
      return
    }
    setPhase('pouring') // the effect above starts playback once the view exists
    sweep.setValue(0)
    fallbackRef.current = setTimeout(finish, POUR_MS + 350)
  }

  // Changing your mind mid-pour rewinds the whole thing.
  useEffect(() => {
    if (phase !== 'idle') reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => () => clearTimeout(fallbackRef.current), [])

  const ctaLabel =
    phase === 'pouring' ? 'Spinning…' : phase === 'ready' ? 'Add to bag' : 'Spin it up'

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.hero, { height: heroH }]}>
        {/* The video stays mounted for the whole session and sits underneath.
            Mounting it only for the pour gave a player that reported
            readyToPlay/playing but drew nothing - an iOS video surface wants to
            exist before it is asked to show frames. Explicit pixel sizes rather
            than percentages, for the same reason. */}
        <VideoView
          player={player}
          style={{ position: 'absolute', top: 0, left: 0, width, height: heroH }}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Both stills stay mounted and are toggled by opacity. Swapping one
            Image's source instead makes it reload, which showed as a flash at
            the moment the pour finished. */}
        <Image
          source={EMPTY}
          style={[
            { position: 'absolute', top: 0, left: 0, width, height: heroH },
            (phase === 'ready' || (phase === 'pouring' && videoLive)) && { opacity: 0 },
          ]}
          resizeMode="cover"
        />
        <Image
          source={FILLED}
          style={[
            { position: 'absolute', top: 0, left: 0, width, height: heroH },
            phase !== 'ready' && { opacity: 0 },
          ]}
          resizeMode="cover"
        />

        <View style={[styles.caption, { bottom: spec.sheetRadius * s + 24 }]}>
          <IngredientTicker
            ingredient={drink.ingredients[stepIdx]}
            active={phase === 'pouring'}
          />
        </View>
      </View>

      <View
        style={[
          styles.sheet,
          {
            height: sheetH,
            borderTopLeftRadius: spec.sheetRadius * s,
            borderTopRightRadius: spec.sheetRadius * s,
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
            disabled={phase === 'pouring'}
          />
        </View>

        <Text style={[styles.name, { top: spec.nameTop * s, fontSize: spec.nameSize * s }]}>
          {drink.name}
        </Text>

        <Pressable
          onPress={pour}
          disabled={phase === 'pouring'}
          style={({ pressed }) => [
            styles.cta,
            {
              width: spec.ctaW * s,
              height: spec.ctaH * s,
              borderRadius: spec.ctaRadius * s,
              bottom: spec.ctaBottom * s,
              marginLeft: -(spec.ctaW * s) / 2,
            },
            pressed && { backgroundColor: theme.ctaPress },
          ]}
        >
          {phase === 'pouring' && (
            <Animated.View
              style={[
                styles.sweep,
                { width: sweep.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              ]}
            />
          )}
          <Text style={[styles.ctaText, { fontSize: spec.ctaTextSize * s }]}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.backdrop },

  hero: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: theme.heroFallback },

  caption: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 10 },

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

  cta: {
    position: 'absolute',
    left: '50%',
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sweep: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  ctaText: { color: '#fff', fontWeight: '500' },
})
