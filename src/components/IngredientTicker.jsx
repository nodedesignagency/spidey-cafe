// The label that rides inside the pour bar: the name of what is going in, and
// nothing else. Renders bare — no background of its own — because the bar it sits
// in is the chrome. Just the ingredient, not "Adding <ingredient>": the redrawn
// button is about half the width the old bar was, and the longest name only
// clears it on its own.
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
      {ingredient.label}
    </span>
  )
}
