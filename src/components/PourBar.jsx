import IngredientTicker from './IngredientTicker'

// The floating action bar — the web twin of mobile/src/components/PourBar.js.
//
// Laid out at exactly the coordinates the sheet's CTA occupies, in the same ink
// at the same size, so when the sheet drops away the button appears to stay
// behind and become the progress bar rather than one thing replacing another.
//
// The sweep is a translucent wash rather than a solid fill: the label sits on
// top of it, and a solid fill in the ingredient's colour would have taken the
// white text with it every time an ingredient was pale.
export default function PourBar({ phase, ingredient, progress, onPress }) {
  const done = phase === 'ready' || phase === 'taken'

  return (
    <button
      type="button"
      className={`pourbar pourbar--${phase}`}
      onClick={onPress}
      disabled={!done || phase === 'taken'}
      aria-label={done ? 'Take it to go' : 'Pouring'}
    >
      <i className="pourbar__fill" style={{ width: `${Math.round(progress * 100)}%` }}>
        <i className="pourbar__tint" style={{ background: ingredient?.color ?? '#fff' }} />
        <i className="pourbar__wash" />
        <i className="pourbar__edge-soft" />
        <i className="pourbar__edge" />
      </i>

      {/* Both labels stay mounted and dip, so the last ingredient can leave
          before the finished-drink label arrives instead of the two overlapping
          at half strength. */}
      <span className="pourbar__labels">
        <span className="pourbar__label pourbar__label--pour">
          <IngredientTicker ingredient={ingredient} active={phase === 'pouring'} />
        </span>
        <span className="pourbar__label pourbar__label--done">
          {phase === 'taken' ? 'Enjoy it ✓' : 'Take it to go'}
        </span>
      </span>
    </button>
  )
}
