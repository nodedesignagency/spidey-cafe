# Spidey Cafe

Design exploration for a spider-web-themed coffee ordering flow.

Pick a drink from the carousel, hit the CTA, and the hero above shows the drink
actually being built: ingredients pour down from off-frame into an empty cup
suspended in a web, until the finished drink is sitting there.

## The interaction

Three states, driven by one `phase` value in `src/App.jsx`:

| phase | hero | CTA |
| --- | --- | --- |
| `idle` | empty cup in the web, breathing gently | **Spin it up** |
| `pouring` | the pour clip, with an ingredient ticker | **Spinning…** (progress sweep) |
| `ready` | the finished drink | **Add to bag** + *Swing another* |

Swiping the carousel mid-pour rewinds to `idle` — changing your mind cancels the
build rather than leaving the hero out of sync with the selection.

The pour has a hard fallback timer, so if the clip is missing or autoplay is
blocked the flow still completes and reaches `ready`.

## Media

The two hero stills and the pour clip were generated with Magnific and are
**not committed** — see [`public/media/README.md`](public/media/README.md) for
what goes where and how each was produced.

The short version: the filled still was generated using the empty one as an
image reference so the web and lighting match, then both were locked as the
start and end keyframes of the clip. That is why the video lands on exactly the
frame the `ready` state shows.

### One clip, five drinks

There is a single pour clip, and it pours chocolate. Each drink differentiates
itself through the ingredient ticker (`src/components/IngredientTicker.jsx`),
which names what is going in, in recipe order, with a colour dot per
ingredient. Overlaying fake CSS particles on photoreal footage was tried first
and read as debris, so it was cut.

## Cup art

The carousel cups are vector (`src/components/CupIcon.jsx`), tinted per drink,
so adding a drink costs no image generation. The roundel on the cup is an
original web motif, not any existing coffee chain's mark.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build && npm run preview
```

## Verified

Driven in Chromium: the full `idle -> pouring -> ready -> reset` path, the
ingredient ticker stepping in order, drink switching rewinding the hero, and all
five cups landing inside the frame with the outer two clipped. No console
errors, no failed requests.

Touch panning of the carousel could not be exercised — headless Chromium does
not deliver synthesized touch gestures to the scroll container (the identical
gesture with a mouse source scrolls it correctly). Scrolling itself is verified
via wheel, mouse gesture, programmatic scroll and tap; the carousel is a plain
`overflow-x: auto` + `scroll-snap` container with `touch-action: auto`, so it
should pan normally on a device.
