import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import CupIcon from './CupIcon'

// Horizontal snap list. The centred cup is the selection, so a swipe and a tap
// are the same gesture. Scale and opacity interpolate off scroll position, so
// the neighbours ease in as you drag rather than popping at the snap point.
export default function DrinkCarousel({ drinks, index, onIndex, disabled }) {
  const { width } = useWindowDimensions()
  const ITEM = Math.round(width * 0.24)
  const listRef = useRef(null)
  const scrollX = useRef(new Animated.Value(0)).current

  // Follow the selection when it changes from outside (e.g. a tap).
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: index * ITEM, animated: true })
  }, [index, ITEM])

  return (
    <Animated.FlatList
      ref={listRef}
      data={drinks}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={!disabled}
      snapToInterval={ITEM}
      decelerationRate="fast"
      disableIntervalMomentum
      contentContainerStyle={{ paddingHorizontal: (width - ITEM) / 2 }}
      getItemLayout={(_, i) => ({ length: ITEM, offset: ITEM * i, index: i })}
      initialScrollIndex={index}
      keyExtractor={(d) => d.id}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      })}
      scrollEventThrottle={16}
      onMomentumScrollEnd={(e) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / ITEM)
        const clamped = Math.max(0, Math.min(drinks.length - 1, i))
        if (clamped !== index) onIndex(clamped)
      }}
      renderItem={({ item, index: i }) => {
        const range = [(i - 1) * ITEM, i * ITEM, (i + 1) * ITEM]
        const scale = scrollX.interpolate({
          inputRange: range,
          outputRange: [0.74, 1, 0.74],
          extrapolate: 'clamp',
        })
        const opacity = scrollX.interpolate({
          inputRange: range,
          outputRange: [0.28, 1, 0.28],
          extrapolate: 'clamp',
        })
        return (
          <Animated.View style={[styles.item, { width: ITEM, opacity, transform: [{ scale }] }]}>
            <Pressable
              onPress={() => onIndex(i)}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              hitSlop={8}
            >
              <CupIcon drink={item} size={ITEM * 1.5} />
            </Pressable>
          </Animated.View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  item: { alignItems: 'center', justifyContent: 'center' },
})
