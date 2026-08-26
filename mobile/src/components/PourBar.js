import { useEffect, useRef } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'

import IngredientTicker from './IngredientTicker'
import { theme } from '../theme'

// The floating action bar, drawn to the redrawn button (node 26:71): a compact
// stadium pill in the ink, wrapped in a white ring.
//
// It is laid out at exactly the coordinates the sheet's CTA occupies, at the
// same size, ring included. So when the sheet drops away the button does not
// move - it stays behind and becomes the progress bar, which is the whole
// reason the collapse reads as the screen handing over rather than as two
// things happening. The ring is the one part that changes: white on white it is
// invisible in the sheet, and it only shows itself once the photo is behind it.
//
// The sweep is a flat fill with a hard edge, as drawn - no leading highlight and
// no per-ingredient tint. Which drink is being built is carried by the hero and
// by the ingredient names themselves, not by the bar.
export default function PourBar({
  phase,
  ingredient,
  sweep,
  onPress,
  width,
  height,
  radius,
  ring,
  bottom,
  fontSize,
  pourFontSize,
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

  return (
    <Pressable
      onPress={onPress}
      disabled={phase !== 'ready'}
      accessibilityRole="button"
      accessibilityLabel={done ? 'Take it to go' : 'Pouring'}
      style={[
        styles.ring,
        {
          width: width + ring * 2,
          height: height + ring * 2,
          borderRadius: radius + ring,
          bottom: bottom - ring,
          marginLeft: -(width + ring * 2) / 2,
          padding: ring,
        },
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.pill,
            {
              width,
              height,
              borderRadius: radius,
              backgroundColor: phase === 'taken' ? theme.ctaDone : theme.ink,
            },
            pressed && phase === 'ready' && { backgroundColor: theme.ctaPress },
          ]}
        >
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: theme.ctaFill,
                width: sweep.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                opacity: settled.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              },
            ]}
          />

          {/* Both labels stay mounted and dip, so the last ingredient can leave
              while the finished-drink label arrives, instead of one snapping to
              the other on the frame the pour ends. */}
          <View style={styles.labels} pointerEvents="none">
            <Animated.View style={styles.labelLayer}>
              <IngredientTicker
                ingredient={ingredient}
                active={phase === 'pouring'}
                fontSize={pourFontSize}
                maxWidth={width - 40}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.labelLayer,
                {
                  opacity: arrive,
                  transform: [
                    { translateY: arrive.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                  ],
                },
              ]}
            >
              <Text style={[styles.ctaText, { fontSize }]} numberOfLines={1}>
                {phase === 'taken' ? 'Enjoy it ✓' : 'Take it to go'}
              </Text>
            </Animated.View>
          </View>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    left: '50%',
    backgroundColor: theme.ctaRing,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },

  labels: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  labelLayer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '500' },
})
