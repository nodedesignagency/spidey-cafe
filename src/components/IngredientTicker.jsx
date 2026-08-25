// The label that rides inside the pour bar: a dot in the ingredient's colour and
// the name of what is going in. Renders bare — no background of its own —
// because the bar it sits in is the chrome.
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
      Adding {ingredient.label.toLowerCase()}
    </span>
  )
}
