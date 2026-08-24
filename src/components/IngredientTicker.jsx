import { useEffect, useState } from 'react'

// One ingredient at a time, in recipe order — this is what makes each drink
// read differently over a single shared clip. Faking per-drink particles on
// top of photoreal footage just looks like debris.
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
    <span key={ing.label} className="chip chip--live">
      <span className="chip__dot" style={{ background: ing.color }} />
      Adding {ing.label.toLowerCase()}
    </span>
  )
}
