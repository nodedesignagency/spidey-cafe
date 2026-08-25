import { StyleSheet, Text, View } from 'react-native'

// Shows one ingredient at a time, chosen by how far through the clip the video
// actually is rather than by a timer of its own — so the label always matches
// what is on screen, whatever speed the clip is playing at.
export default function IngredientTicker({ drink, active, progress }) {
  if (!active) return null

  let ing = drink.ingredients[0]
  for (const candidate of drink.ingredients) {
    if (progress >= candidate.at) ing = candidate
  }

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
