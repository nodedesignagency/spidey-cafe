import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'

// The label that rides inside the pour bar: a dot in the ingredient's colour and
// the name of what is going in. Renders bare - no background of its own - because
// the bar it sits in is the chrome. The dot is now the only thing carrying the
// ingredient's colour, since the sweep behind it is a flat fill.
//
// Fades and lifts itself in and out, and dips between ingredients, rather than
// snapping. `shown` lags the prop on purpose: the outgoing label has to stay
// mounted long enough to animate away.
export default function IngredientTicker({ ingredient, active, fontSize = 16, maxWidth }) {
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
        styles.row,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: shown.color }]} />
      {/* Just the ingredient, not "Adding <ingredient>": the redrawn button is
          about half the width the old bar was, and the longest name only clears
          it on its own. The dot and the filling bar already say what is
          happening to it. Shrinks a little further if a name still overruns. */}
      <Text
        style={[styles.label, { fontSize, maxWidth }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {shown.label}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  // Ringed so the dot still reads when the sweep passes underneath it.
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  label: { color: '#fff', fontWeight: '500' },
})
