import { useEffect, useRef } from 'react'
import { Animated, Image, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { art } from '../data/art'
import { scale, spec } from '../theme'

// Horizontal snap list. The centred cup is the selection, so a swipe and a tap
// are the same gesture.
//
// The Figma row steps the cups down through three sizes either side of centre
// (172 / 132.9 / 103.6) and overlaps them by 41pt, which leaves the gaps between
// centres uneven. A snap carousel needs one uniform step, so spec.cupStep is
// that spacing averaged — it puts the centre and both outer cups within a point
// or two of the frame. Sizes interpolate off scroll position, so the neighbours
// also ease in as you drag rather than popping at the snap point.
export default function DrinkCarousel({ drinks, index, onIndex, disabled }) {
  const { width } = useWindowDimensions()
  const s = scale(width)

  const CUP = Math.round(spec.cupBox * s) // row height, from the frame
  const cupW = Math.round(CUP * spec.cupAspect)
  const ITEM = Math.round(spec.cupStep * s)

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
      style={{ height: CUP, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: (width - ITEM) / 2, alignItems: 'center' }}
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
        const range = [-2, -1, 0, 1, 2].map((d) => (i + d) * ITEM)
        const [c0, c1, c2] = spec.cupScales
        const scaleAnim = scrollX.interpolate({
          inputRange: range,
          outputRange: [c2, c1, c0, c1, c2],
          extrapolate: 'clamp',
        })
        const opacity = scrollX.interpolate({
          inputRange: range,
          outputRange: [spec.sideOpacity, spec.sideOpacity, 1, spec.sideOpacity, spec.sideOpacity],
          extrapolate: 'clamp',
        })
        return (
          <Animated.View
            style={[styles.item, { width: ITEM, opacity, transform: [{ scale: scaleAnim }] }]}
          >
            <Pressable
              onPress={() => onIndex(i)}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              hitSlop={8}
            >
              <Image
                source={art[item.id]}
                style={{ width: cupW, height: CUP }}
                resizeMode="contain"
              />
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
