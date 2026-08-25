import { useEffect, useRef } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'

import IngredientTicker from './IngredientTicker'
import { theme } from '../theme'

// The floating action bar.
//
// It is laid out at exactly the coordinates the sheet's CTA occupies, in the same
// ink, at the same size. So when the sheet drops away the button does not move -
// it stays behind and becomes the progress bar, which is the whole reason the
// collapse reads as the screen handing over rather than as two things happening.
//
// The sweep is a translucent wash rather than a solid fill: the label sits on top
// of it, and a solid bright fill in the ingredient's colour would have taken the
// white text with it every time an ingredient was pale. The ingredient's colour
// still drives the bar - as a tint under the wash, and as the dot in the label -
// and the bright leading edge gives it the scanning head the fill would have.
export default function PourBar({
  phase,
  ingredient,
  sweep,
  onPress,
  width,
  height,
  radius,
  bottom,
  fontSize,
}) {
  const done = phase === 'ready' || phase === 'taken'
  // 0 while pouring, 1 once the drink is standing there. Retires the sweep and
  // hands the bar back to a plain button.
  const settled = useRef(new Animated.Value(0)).current
  // The finished label runs on its own clock rather than off `settled`. Sharing
  // one value meant sharing its ease-out, which crosses half way in a fifth of
  // its duration - so the label was already arriving while the ingredient was
  // still leaving, and the bar showed both at once.
  const arrive = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(settled, {
      toValue: done ? 1 : 0,
      duration: done ? 320 : 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()

    if (!done) {
      arrive.setValue(0)
      return undefined
    }
    // Held back for the ingredient's own 200ms exit, so the bar dips to empty
    // between the two labels.
    const entrance = Animated.sequence([
      Animated.delay(230),
      Animated.timing(arrive, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ])
    entrance.start()
    return () => entrance.stop()
  }, [done, settled, arrive])

  const tint = ingredient?.color ?? theme.sheet

  return (
    <Pressable
      onPress={onPress}
      disabled={phase !== 'ready'}
      accessibilityRole="button"
      accessibilityLabel={done ? 'Take it to go' : 'Pouring'}
      style={({ pressed }) => [
        styles.bar,
        {
          width,
          height,
          borderRadius: radius,
          bottom,
          marginLeft: -width / 2,
          backgroundColor: phase === 'taken' ? theme.ctaDone : theme.ink,
        },
        pressed && phase === 'ready' && { backgroundColor: theme.ctaPress },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: sweep.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            opacity: settled.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint, opacity: 0.38 }]} />
        <View style={[StyleSheet.absoluteFill, styles.wash]} />
        <View style={styles.edgeSoft} />
        <View style={styles.edge} />
      </Animated.View>

      {/* Both labels stay mounted and cross-fade, so the last ingredient can leave
          while the finished-drink label arrives, instead of one snapping to the
          other on the frame the pour ends. */}
      <View style={styles.labels} pointerEvents="none">
        <Animated.View style={styles.labelLayer}>
          <IngredientTicker
            ingredient={ingredient}
            active={phase === 'pouring'}
            fontSize={fontSize}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.labelLayer,
            {
              opacity: arrive,
              transform: [
                {
                  translateY: arrive.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.ctaText, { fontSize }]}>
            {phase === 'taken' ? 'Enjoy it ✓' : 'Take it to go'}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  wash: { backgroundColor: 'rgba(255,255,255,0.17)' },
  // A soft shoulder behind a hard bright line: together they read as the head of
  // the pour travelling across the bar.
  edgeSoft: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  edge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 2.5,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },

  labels: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  labelLayer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ctaText: {
    color: '#fff',
    fontWeight: '500',
    textShadowColor: 'rgba(20,12,8,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
})
