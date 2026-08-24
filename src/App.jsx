import { useCallback, useEffect, useRef, useState } from 'react'
import { drinks, DEFAULT_INDEX } from './data/drinks'
import StatusBar from './components/StatusBar'
import DrinkCarousel from './components/DrinkCarousel'
import IngredientTicker from './components/IngredientTicker'

const POUR_MS = 5000 // matches the generated clip; also the no-video fallback

export default function App() {
  const [index, setIndex] = useState(DEFAULT_INDEX)
  const [phase, setPhase] = useState('idle') // idle | pouring | ready
  const videoRef = useRef(null)
  const fallbackRef = useRef(null)

  const drink = drinks[index]

  const finish = useCallback(() => {
    clearTimeout(fallbackRef.current)
    setPhase('ready')
  }, [])

  const pour = () => {
    if (phase === 'pouring') return
    if (phase === 'ready') {
      reset()
      return
    }
    setPhase('pouring')
    const v = videoRef.current
    if (v) {
      try {
        v.currentTime = 0
        const p = v.play()
        if (p?.catch) p.catch(() => {})
      } catch {
        /* fall through to the timer below */
      }
    }
    // Guarantees the flow completes even if the clip is missing or blocked.
    fallbackRef.current = setTimeout(finish, POUR_MS + 350)
  }

  const reset = () => {
    clearTimeout(fallbackRef.current)
    const v = videoRef.current
    if (v) {
      v.pause()
      v.currentTime = 0
    }
    setPhase('idle')
  }

  // Changing your mind mid-pour rewinds the whole thing.
  useEffect(() => {
    if (phase !== 'idle') reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => () => clearTimeout(fallbackRef.current), [])

  const ctaLabel =
    phase === 'pouring' ? 'Spinning…' : phase === 'ready' ? 'Add to bag' : 'Spin it up'

  return (
    <div className="page">
      <span className="page__crumb">Home</span>

      <div className="phone">
        <div className={`stage stage--${phase}`}>
          <img className="stage__layer stage__layer--empty" src="/media/cup-empty.jpg" alt="" />

          <video
            ref={videoRef}
            className="stage__layer stage__layer--video"
            poster="/media/cup-empty.jpg"
            muted
            playsInline
            preload="auto"
            onEnded={finish}
          >
            {/* MP4 first: H.264 is the highest-quality and most widely supported
                option. The WebM is the fallback for builds without H.264. */}
            <source src="/media/pour.mp4" type="video/mp4" />
            <source src="/media/pour.webm" type="video/webm" />
          </video>

          <img
            className="stage__layer stage__layer--filled"
            src="/media/cup-filled.jpg"
            alt={`${drink.name} suspended in a web`}
          />

          <div className="stage__scrim" />
          <StatusBar />

          <div className="stage__caption">
            <IngredientTicker
              drink={drink}
              active={phase === 'pouring'}
              stepMs={POUR_MS / drink.ingredients.length}
            />
            {phase === 'ready' && (
              <span className="chip" aria-live="polite">Caught it. Ready in 4 min</span>
            )}
          </div>
        </div>

        <div className="sheet">
          <h1 className="sheet__title">What are we swinging today?</h1>

          <DrinkCarousel
            drinks={drinks}
            index={index}
            onIndex={setIndex}
            disabled={phase === 'pouring'}
          />

          <div className="sheet__meta">
            <p className="sheet__name">{drink.name}</p>
            <p className="sheet__tagline">{drink.tagline}</p>
          </div>

          <button
            type="button"
            className={`cta cta--${phase}`}
            onClick={pour}
            disabled={phase === 'pouring'}
          >
            <span>{ctaLabel}</span>
            {phase === 'pouring' && <i className="cta__bar" style={{ animationDuration: `${POUR_MS}ms` }} />}
          </button>

          <button
            type="button"
            className={`ghost${phase === 'ready' ? '' : ' ghost--hidden'}`}
            onClick={reset}
            tabIndex={phase === 'ready' ? 0 : -1}
            aria-hidden={phase !== 'ready'}
          >
            Swing another
          </button>
        </div>
      </div>
    </div>
  )
}
