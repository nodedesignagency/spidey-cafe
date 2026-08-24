import { useCallback, useEffect, useRef } from 'react'
import CupIcon from './CupIcon'

// Scroll-snap carousel. The centred item is the selection, so a swipe and a
// tap are the same gesture — no separate "confirm" step.
export default function DrinkCarousel({ drinks, index, onIndex, disabled }) {
  const trackRef = useRef(null)
  const itemsRef = useRef([])
  const settleRef = useRef(null)

  const scrollTo = useCallback((i, behavior = 'smooth') => {
    const el = itemsRef.current[i]
    const track = trackRef.current
    if (!el || !track) return
    track.scrollTo({
      left: el.offsetLeft - (track.clientWidth - el.clientWidth) / 2,
      behavior,
    })
  }, [])

  // Keep the track centred on the active drink when it changes externally.
  useEffect(() => {
    scrollTo(index, 'smooth')
  }, [index, scrollTo])

  // Centre on first paint without animating.
  useEffect(() => {
    scrollTo(index, 'auto')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = () => {
    const track = trackRef.current
    if (!track) return
    clearTimeout(settleRef.current)
    settleRef.current = setTimeout(() => {
      const mid = track.scrollLeft + track.clientWidth / 2
      let best = 0
      let bestDist = Infinity
      itemsRef.current.forEach((el, i) => {
        if (!el) return
        const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - mid)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
      if (best !== index) onIndex(best)
    }, 90)
  }

  return (
    <div
      className={`carousel${disabled ? ' carousel--locked' : ''}`}
      ref={trackRef}
      onScroll={handleScroll}
      role="listbox"
      aria-label="Choose your drink"
    >
      <div className="carousel__pad" />
      {drinks.map((d, i) => (
        <button
          key={d.id}
          type="button"
          ref={(el) => {
            itemsRef.current[i] = el
          }}
          className={`carousel__item${i === index ? ' is-active' : ''}`}
          onClick={() => onIndex(i)}
          role="option"
          aria-selected={i === index}
          aria-label={d.name}
          tabIndex={i === index ? 0 : -1}
        >
          <CupIcon drink={d} size={i === index ? 150 : 104} />
        </button>
      ))}
      <div className="carousel__pad" />
    </div>
  )
}
