import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

// One ingredient at a time, in recipe order. This is what makes each drink read
// differently over a single shared clip.
export default function IngredientTicker({ drink, active, stepMs }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!active) {
      setStep(0)
      return undefined
    }
    setStep(0)
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, drink.ingredients.length - 1))
    }, stepMs)
    return () => clearInterval(id)
  }, [active, drink, stepMs])

  if (!active) return null

  const ing = drink.ingredients[step]

  return (
    <View style={styles.chip}>
      <View style={[styles.dot, { backgroundColor: ing.color }]} />
      <Text style={styles.label}>Adding {ing.label.toLowerCase()}</Text>
    </View>
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
