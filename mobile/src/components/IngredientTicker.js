import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'

// Fades and lifts itself in and out, and dips between ingredients, rather than
// snapping. `shown` lags the prop on purpose: the outgoing label has to stay
// mounted long enough to animate away.
export default function IngredientTicker({ ingredient, active }) {
  const anim = useRef(new Animated.Value(0)).current
  const [shown, setShown] = useState(null)
  const shownLabel = useRef(null)

  useEffect(() => {
    const enter = (ing, duration) => {
      shownLabel.current = ing.label
      setShown(ing)
      anim.setValue(0)
      Animated.timing(anim, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    }

    const leave = (duration, then) =>
      Animated.timing(anim, {
        toValue: 0,
        duration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => finished && then())

    // Leaving entirely.
    if (!active || !ingredient) {
      if (shownLabel.current == null) return
      leave(200, () => {
        shownLabel.current = null
        setShown(null)
      })
      return
    }

    if (shownLabel.current === ingredient.label) return
    // First one in gets a slightly longer entrance; the rest dip and swap.
    if (shownLabel.current == null) enter(ingredient, 300)
    else leave(150, () => enter(ingredient, 240))
  }, [active, ingredient, anim])

  if (!shown) return null

  return (
    <Animated.View
      style={[
        styles.chip,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
          ],
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: shown.color }]} />
      <Text style={styles.label}>Adding {shown.label.toLowerCase()}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(28, 18, 12, 0.72)',
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  label: { color: '#fff', fontSize: 13, fontWeight: '500' },
})
