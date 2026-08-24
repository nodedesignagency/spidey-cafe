# Spidey Cafe

Design exploration for a spider-web-themed coffee ordering flow.

Pick a drink from the carousel, hit the CTA, and the hero above shows the drink
actually being built: ingredients pour down from off-frame into an empty cup
suspended in a web, until the finished drink is sitting there.

Two builds of the same flow:

| | where | what it is for |
| --- | --- | --- |
| `mobile/` | Expo Go, or a simulator | the real thing, on a phone |
| root | a desktop browser | quick look and sharing by URL |

## Running it on a phone

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go. Both devices need to be on the same wifi; add
`--tunnel` if they are not.

## Running the web version

```bash
npm install
npm run dev -- --host
```

This one draws its own phone bezel and status bar, which reads correctly on a
desktop viewport and badly on an actual handset — you get a phone inside a
phone, two status bars, and a squashed hero. Use `mobile/` for anything on a
device.

## The interaction

Three states, driven by one `phase` value:

| phase | hero | CTA |
| --- | --- | --- |
| `idle` | empty cup in the web | **Spin it up** |
| `pouring` | the pour clip, with an ingredient ticker | **Spinning…** (progress sweep) |
| `ready` | the finished drink | **Add to bag** + *Swing another* |

Swiping the carousel mid-pour rewinds to `idle` — changing your mind cancels the
build rather than leaving the hero out of sync with the selection.

The pour has a hard fallback timer, so if the clip fails to load or autoplay is
blocked the flow still completes and reaches `ready`.

## Matching the frame

`mobile/src/theme.js` holds the measurements from the Figma frame (node 0:102,
drawn at 393pt wide) as its own numbers — sheet 369 tall with a 40 radius, title
20, drink name 14, CTA 350x56 at 20 from the bottom, ink `#3c2c21`. Positional
values are multiplied by `width / 393` so proportions hold on other handsets.

Two deliberate departures, both noted in the code:

- The frame's cup centres are unevenly spaced, because the cups differ in width.
  A snap carousel needs one uniform step, so `cupStep` is that spacing averaged.
  It lands the centre and both outer cups within a point or two of the frame.
- The frame has no reset control and no room for one, so *Swing another* sits on
  the hero rather than in the sheet.

## Media

The hero stills and the pour clip were generated with Magnific — see
[`public/media/README.md`](public/media/README.md) for how. `mobile/assets/`
holds byte-identical copies, since Metro bundles from inside its own project.

### One clip, five drinks

There is a single pour clip, and it pours chocolate. Each drink differentiates
itself through the ingredient ticker, which names what is going in, in recipe
order. Overlaying fake CSS particles on photoreal footage was tried first and
read as debris, so it was cut. Giving each drink its own real pour means one
more generated clip per drink.

## Cup art

The carousel cups are vector, tinted per drink, so adding a drink costs no image
generation — `src/components/CupIcon.jsx` on web, the `react-native-svg` port in
`mobile/`. The roundel is an original web motif, not any existing coffee chain's
mark.

## Verified

From a clean clone of this branch: `npm install` then an iOS bundle, with all
three assets resolving. The layout and the full `idle -> pouring -> ready ->
reset` path were driven at 393x852 through the react-native-web build, with the
rendered geometry measured against the frame.

Not verified: playback on a real device, and touch panning of the carousel.
Neither headless Chromium nor a simulator exercises real touch, so those want a
ten-second check on an actual phone.
