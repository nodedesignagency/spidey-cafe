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
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView } from 'expo-video'

import { drinks, DEFAULT_INDEX } from './src/data/drinks'
import DrinkCarousel from './src/components/DrinkCarousel'
import IngredientTicker from './src/components/IngredientTicker'
import { scale, spec, theme } from './src/theme'

const POUR_MS = 5000 // length of the generated clip; also the no-video fallback

// Temporary: prints the player's real state over the hero while it pours, so a
// failure to play can be read off the screen instead of guessed at. Flip to
// false once the clip is confirmed working.
const DEBUG_VIDEO = true

const EMPTY = require('./assets/cup-empty.jpg')
const FILLED = require('./assets/cup-filled.jpg')
const POUR = require('./assets/pour.mp4')

function Screen() {
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const s = scale(width)
  const sheetH = spec.sheetH * s + insets.bottom
  // The hero runs under the sheet's rounded corners so the photo shows through them.
  const heroH = height - sheetH + spec.sheetRadius * s

  const [index, setIndex] = useState(DEFAULT_INDEX)
  const [phase, setPhase] = useState('idle') // idle | pouring | ready
  const [diag, setDiag] = useState('starting…')
  // Only hide the still once the clip is genuinely rendering, so a playback
  // failure leaves the photo up rather than an empty hero.
  const [videoLive, setVideoLive] = useState(false)
  const fallbackRef = useRef(null)

  const drink = drinks[index]

  const player = useVideoPlayer(POUR, (p) => {
    p.muted = true
    p.loop = false
  })

  const sweep = useRef(new Animated.Value(0)).current
  const videoBox = useRef('?')

  const finish = useCallback(() => {
    clearTimeout(fallbackRef.current)
    setVideoLive(false)
    setPhase('ready')
  }, [])

  // The clip ending is the real signal; the timer below is only a safety net.
  useEffect(() => {
    if (!player?.addListener) return undefined
    const ended = player.addListener('playToEnd', () => finish())
    const status = player.addListener('statusChange', (e) => {
      if (e?.error) setDiag(`error: ${e.error.message ?? String(e.error)}`)
    })
    return () => {
      ended?.remove?.()
      status?.remove?.()
    }
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
      player.play()
    } catch (e) {
      setDiag(`play threw: ${e?.message ?? e}`)
    }
    const id = setInterval(() => {
      try {
        setVideoLive(player.status === 'readyToPlay' && player.playing === true)
        if (DEBUG_VIDEO) {
          const t = typeof player.currentTime === 'number' ? player.currentTime.toFixed(1) : '?'
          setDiag(`${player.status} · playing=${player.playing} · t=${t} · view=${videoBox.current}`)
        }
      } catch (e) {
        if (DEBUG_VIDEO) setDiag(`read threw: ${e?.message ?? e}`)
      }
    }, 250)
    return () => clearInterval(id)
  }, [phase, player])

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
    Animated.timing(sweep, {
      toValue: 1,
      duration: POUR_MS,
      useNativeDriver: false,
    }).start()
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
          onLayout={(e) => {
            const { width: w, height: h } = e.nativeEvent.layout
            videoBox.current = `${Math.round(w)}x${Math.round(h)}`
          }}
        />

        {/* The still covers the video, and simply gets out of the way during the
            pour. Fading an Image is reliable; hiding a native video view is not. */}
        <Image
          source={phase === 'ready' ? FILLED : EMPTY}
          style={[
            { position: 'absolute', top: 0, left: 0, width, height: heroH },
            phase === 'pouring' && videoLive && { opacity: 0 },
          ]}
          resizeMode="cover"
        />

        {/* Status lives over the hero, so the sheet keeps the frame's exact geometry. */}
        <View style={[styles.caption, { bottom: spec.sheetRadius * s + 24 }]}>
          <IngredientTicker
            drink={drink}
            active={phase === 'pouring'}
            stepMs={POUR_MS / drink.ingredients.length}
          />
          {DEBUG_VIDEO && phase === 'pouring' && (
            <View style={styles.diagChip}>
              <Text style={styles.diagText}>{diag}</Text>
            </View>
          )}
          {phase === 'ready' && (
            <>
              <View style={styles.readyChip}>
                <Text style={styles.readyText}>Caught it. Ready in 4 min</Text>
              </View>
              <Pressable onPress={reset} hitSlop={10}>
                <Text style={styles.again}>Swing another</Text>
              </Pressable>
            </>
          )}
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
              bottom: spec.ctaBottom * s + insets.bottom,
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

export default function App() {
  return (
    <SafeAreaProvider>
      <Screen />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.backdrop },

  hero: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: theme.heroFallback },

  caption: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 10 },
  readyChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(28, 18, 12, 0.72)',
  },
  readyText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  diagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  diagText: { color: '#7CFFB2', fontSize: 11, fontWeight: '600' },
  again: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 6,
  },

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
