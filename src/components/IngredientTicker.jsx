// The label that rides inside the pour bar: a dot in the ingredient's colour and
// the name of what is going in. Renders bare — no background of its own —
// because the bar it sits in is the chrome. Just the ingredient, not
// "Adding <ingredient>": the redrawn button is about half the width the old bar
// was, and the longest name only clears it on its own. The dot is also the only
// thing carrying the ingredient's colour now that the sweep is a flat fill.
//
// Which ingredient is showing is decided by the pour's own progress through the
// clip, up in App, so the names track what is actually happening on screen
// rather than a timer running alongside it.
export default function IngredientTicker({ ingredient, active }) {
  if (!active || !ingredient) return null

  return (
    // Keyed on the label so each ingredient gets its own entrance rather than
    // the text swapping inside a node that is already on screen.
    <span className="ticker" key={ingredient.label}>
      <span className="ticker__dot" style={{ background: ingredient.color }} />
      {ingredient.label}
    </span>
  )
}
