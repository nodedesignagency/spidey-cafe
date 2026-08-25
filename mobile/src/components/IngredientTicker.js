import { StyleSheet, Text, View } from 'react-native'

// Renders whichever ingredient the screen decided is current. Choosing it lives
// upstream, where the clip's position is already known, so this only re-renders
// when the ingredient actually changes rather than on every poll tick.
export default function IngredientTicker({ ingredient, active }) {
  if (!active || !ingredient) return null

  return (
    <View style={styles.chip}>
      <View style={[styles.dot, { backgroundColor: ingredient.color }]} />
      <Text style={styles.label}>Adding {ingredient.label.toLowerCase()}</Text>
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
