import { Animated, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

// The ambient screen glow from the reference, translated for a hero that is a
// sunlit cream wall rather than a dark screen. Light spilling in from the edges
// would be invisible here, so the edges deepen instead: the drink's own darkest
// colour closes in from the sides and the floor while the pour runs, leaving the
// cup as the only thing still lit, and pooling under the bar so it sits in
// something rather than floating on the photo.
export default function EdgeGlow({ width, height, color, opacity }) {
  const side = Math.round(width * 0.44)
  const foot = Math.round(height * 0.36)

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="eg-left" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.74" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="eg-right" x1="1" y1="0" x2="0" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.74" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="eg-foot" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.88" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width={side} height={height} fill="url(#eg-left)" />
        <Rect x={width - side} y="0" width={side} height={height} fill="url(#eg-right)" />
        <Rect x="0" y={height - foot} width={width} height={foot} fill="url(#eg-foot)" />
      </Svg>
    </Animated.View>
  )
}
