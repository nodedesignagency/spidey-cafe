import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { drinks, DEFAULT_INDEX } from './data/drinks'
import StatusBar from './components/StatusBar'
import DrinkCarousel from './components/DrinkCarousel'
import Celebration from './components/Celebration'
import PourBar from './components/PourBar'

// Kept in step with mobile/App.js — the clip runs 5.08s and reads as rushed at
// full speed, and the drink is visually finished about 80% of the way through,
// so the pour ends there rather than running on into dead frames.
const PLAYBACK_RATE = 0.8
const CLIP_SECONDS = 5.08
const END_AT = 0.82
const POUR_MS = Math.round(((CLIP_SECONDS * END_AT) / PLAYBACK_RATE) * 1000)

// The sheet drops away faster than the photo opens, so the hero is still
// settling once the white is gone. Mirrors mobile/src/theme.js.
const MOTION = { collapse: 380, bleed: 620, restore: 520 }

export default function App() {
  const [index, setIndex] = useState(DEFAULT_INDEX)
  const [phase, setPhase] = useState('idle') // idle | pouring | ready | taken
  // Mirrors `phase` for the guards below. The timers all fire outside the render
  // that created them, so reading the state variable there gives whatever it was
  // at the time — which is how the screen could jump to 'ready' while idle.
  const phaseRef = useRef('idle')
  const [stepIdx, setStepIdx] = useState(0)
  // Whether the sheet is sitting up, tracked apart from `phase`: on the way back
  // the sheet has to start rising immediately while the phase stays 'taken' a
  // moment longer, so the bar is still mounted and hidden behind it rather than
  // popping out from under it.
  const [sheetUp, setSheetUp] = useState(true)
  const [progress, setProgress] = useState(0)
  // True once the hero has finished opening. Playback waits for it so the pour
  // does not start behind a sheet that is still falling.
  const [expanded, setExpanded] = useState(false)

  const videoRef = useRef(null)
  const phoneRef = useRef(null)
  const sheetRef = useRef(null)
  const fallbackRef = useRef(null)
  const takenRef = useRef(null)
  const openRef = useRef(null)
  const startedAt = useRef(0)

  const drink = drinks[index]
  // Read inside the poll so the interval never has to list `drink` as a
  // dependency; doing so restarted playback whenever the selection changed.
  const drinkRef = useRef(drink)
  drinkRef.current = drink

  const goTo = useCallback((next) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  // The hero is framed behind the sheet while it is up and fills the phone once
  // it has gone. Both heights are measured rather than guessed: the sheet sizes
  // itself to its content, so the overlap that lets the photo show through its
  // rounded corners is only correct if it follows the real height.
  useLayoutEffect(() => {
    const measure = () => {
      const phone = phoneRef.current
      const sheet = sheetRef.current
      if (!phone || !sheet) return
      const full = phone.clientHeight
      phone.style.setProperty('--hero-full', `${full}px`)
      phone.style.setProperty('--hero-h', `${full - sheet.offsetHeight + 40}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (phoneRef.current) ro.observe(phoneRef.current)
    if (sheetRef.current) ro.observe(sheetRef.current)
    return () => ro.disconnect()
  }, [])

  // Guarded: the fallback timer and the clip's own `ended` can both fire when
  // nothing is pouring, and without this they dragged the screen into 'ready'.
  const finish = useCallback(() => {
    clearTimeout(fallbackRef.current)
    if (phaseRef.current !== 'pouring') return
    const v = videoRef.current
    if (v) v.pause()
    setProgress(1)
    setStepIdx(0)
    goTo('ready')
  }, [goTo])

  // Playback starts once the hero has finished opening, not on the tap.
  useEffect(() => {
    if (phase !== 'pouring' || !expanded) return undefined
    const v = videoRef.current
    if (v) {
      try {
        v.currentTime = 0
        v.playbackRate = PLAYBACK_RATE
        const p = v.play()
        if (p?.catch) p.catch(() => {})
      } catch {
        /* fall through to the fallback timer below */
      }
    }
    startedAt.current = Date.now()
    // Guarantees the flow reaches 'ready' even if the clip is missing or blocked.
    fallbackRef.current = setTimeout(finish, POUR_MS + 350)

    const id = setInterval(() => {
      // Progress through the clip itself, so slowing playback slows the chips
      // with it. Wall-clock is only the fallback when nothing is rendering,
      // scaled to END_AT so both paths finish on the same number.
      const live = v && !v.paused && v.readyState >= 2 && v.duration > 0
      const raw = Math.max(
        0,
        Math.min(1, live ? v.currentTime / v.duration : ((Date.now() - startedAt.current) / POUR_MS) * END_AT),
      )

      // Ingredient `at` values are fractions of the whole clip, so they read raw.
      let next = 0
      drinkRef.current.ingredients.forEach((ing, i) => {
        if (raw >= ing.at) next = i
      })
      setStepIdx((cur) => (cur === next ? cur : next))
      // The bar spans up to END_AT, so it fills exactly as the pour completes.
      setProgress(Math.min(1, raw / END_AT))

      if (raw >= END_AT) finish()
    }, 120)

    return () => {
      clearInterval(id)
      clearTimeout(fallbackRef.current)
    }
  }, [phase, expanded, finish])

  const reset = useCallback(() => {
    clearTimeout(fallbackRef.current)
    clearTimeout(takenRef.current)
    clearTimeout(openRef.current)
    const v = videoRef.current
    if (v) {
      v.pause()
      v.currentTime = 0
    }
    setExpanded(false)

    // Cancelling mid-pour has nothing left worth looking at, so the screen drops
    // back immediately. Finishing a drink keeps the bar and the photo up until
    // the sheet has risen over them, so the last thing you see is the drink.
    const cancelled = phaseRef.current === 'pouring'
    if (cancelled) {
      setSheetUp(true)
      setProgress(0)
      setStepIdx(0)
      goTo('idle')
      return
    }
    setSheetUp(true)
    openRef.current = setTimeout(() => {
      setProgress(0)
      setStepIdx(0)
      goTo('idle')
    }, MOTION.restore)
  }, [goTo])

  const pour = () => {
    if (phase === 'pouring' || phase === 'taken') return
    if (phase === 'ready') {
      // Acknowledge the tap before clearing. Resetting straight to idle made
      // taking the drink look identical to nothing happening.
      goTo('taken')
      takenRef.current = setTimeout(reset, 1400)
      return
    }
    goTo('pouring')
    setSheetUp(false)
    setProgress(0)
    setStepIdx(0)
    setExpanded(false)
    openRef.current = setTimeout(() => setExpanded(true), MOTION.bleed)
  }

  // Changing your mind mid-pour rewinds the whole thing. Reads the ref, not the
  // state, so a swipe can never leave a stale pour timer running behind it.
  const resetRef = useRef(reset)
  resetRef.current = reset
  useEffect(() => {
    if (phaseRef.current !== 'idle') resetRef.current()
  }, [index])

  useEffect(
    () => () => {
      clearTimeout(fallbackRef.current)
      clearTimeout(takenRef.current)
      clearTimeout(openRef.current)
    },
    [],
  )

  const down = phase !== 'idle'

  return (
    <div className="page">
      <span className="page__crumb">Home</span>

      <div
        className={`phone phone--${phase}${sheetUp ? '' : ' phone--down'}`}
        ref={phoneRef}
        style={{
          '--t-collapse': `${MOTION.collapse}ms`,
          '--t-bleed': `${MOTION.bleed}ms`,
          '--t-restore': `${MOTION.restore}ms`,
        }}
      >
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

          {/* The reference's ambient screen glow, inverted for a hero that is a
              sunlit cream wall: light spilling in from the edges would be
              invisible, so the edges deepen into the drink's darkest colour
              instead, closing in as the pour runs and opening up for the reveal. */}
          <div
            className="stage__glow"
            style={{ '--glow': drink.drizzle, '--glow-strength': down ? 0.5 + progress * 0.5 : 0 }}
          />

          <Celebration active={phase === 'ready' || phase === 'taken'} drink={drink} />

          <div className="stage__scrim" />
          <StatusBar />
        </div>

        <div className="sheet" ref={sheetRef} aria-hidden={down} inert={down ? '' : undefined}>
          <h1 className="sheet__title">What are we swinging today?</h1>

          <DrinkCarousel drinks={drinks} index={index} onIndex={setIndex} disabled={down} />

          <div className="sheet__meta">
            <p className="sheet__name">{drink.name}</p>
            <p className="sheet__tagline">{drink.tagline}</p>
          </div>

          {/* Sits at the exact coordinates PourBar takes over, in the same ink at
              the same size, so the handover across the collapse is invisible. */}
          <button type="button" className="cta" onClick={pour} disabled={down}>
            <span>Spin it up</span>
          </button>
        </div>

        {down && (
          <PourBar
            phase={phase}
            ingredient={drink.ingredients[stepIdx]}
            progress={progress}
            onPress={pour}
          />
        )}
      </div>
    </div>
  )
}
