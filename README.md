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

It runs the same four-phase flow as `mobile/`, in CSS rather than `Animated`.
Where it still differs is the carousel art, below.

## The interaction

Four states, driven by one `phase` value:

| phase | screen | bar |
| --- | --- | --- |
| `idle` | empty cup above the sheet | **Spin it up**, in the sheet |
| `pouring` | sheet gone, pour clip full bleed | the ingredient going in, filling |
| `ready` | the finished drink, confetti | **Take it to go** |
| `taken` | the finished drink | **Enjoy it ✓**, then back to `idle` |

Tapping the CTA collapses the sheet: it shrinks and drops off the bottom, and
the hero opens into the space it leaves, so the pour gets the whole screen.

The button does not move. The bar that shows the pour is laid out at exactly the
coordinates the sheet's CTA occupies, in the same ink at the same size, ring
included, so the handover across the collapse is invisible — the button appears
to stay behind while the white falls away, and then fills as the drink is built.
The ingredient ticker lives inside it: one element names what is going in and
shows how far along it is.

The ring is the one part that changes across the handover, and only because of
what is behind it: white on the white sheet it is invisible, and it shows itself
as the sheet drops and the photo arrives underneath.

The sheet stays down for `ready` and `taken` and only springs back once the
drink has been taken. So the carousel is unreachable from the moment the pour
starts — the mid-pour rewind is still in the code, and still fires if the
selection changes, but there is no longer a gesture that reaches it.

Playback waits for the hero to finish opening, and the pour ends at 82% of the
clip, where the drink is visually finished and the rest is the cup just sitting
there. There is also a hard fallback timer, so if the clip fails to load or
autoplay is blocked the flow still completes and reaches `ready`.

## Matching the frame

`mobile/src/theme.js` holds the measurements from the Figma frame (node 0:102,
drawn at 393pt wide) as its own numbers — sheet 369 tall with a 40 radius, title
20, drink name 14, ink `#3c2c21`. Positional values are multiplied by
`width / 393` so proportions hold on other handsets.

The button is the exception: it was redrawn separately (node 26:71) as a compact
stadium pill, 186x52 at 20 from the bottom, wrapped in a 7.5 white ring, with the
pour sweeping across it as a flat `#63564d` fill behind a hard edge. Measured off
that frame twice — against its phone width, and against the 125pt Dynamic Island
in its status bar — which agreed to within a couple of points.

The ring is why the pour label is the ingredient's name on its own rather than
"Adding <ingredient>". At 186 wide the longer phrasing does not fit, and the
coloured dot beside it already says what the name is for. That dot is also the
only thing carrying the ingredient's colour now, since the sweep behind it is one
flat brown rather than a per-ingredient tint.

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

The two builds differ here. `mobile/` uses the generated cut-outs in
`mobile/assets/drink-*.png`, cropped to one shared box so the five cups keep
their relative scale. The web build still draws the vector cup in
`src/components/CupIcon.jsx` — tinted per drink, so adding a drink there costs no
image generation. The vector roundel is an original web motif, not any existing
coffee chain's mark.

## Verified

Both builds bundle from a clean clone, and both were driven through the full
`idle -> pouring -> ready -> taken -> idle` path with the geometry measured at
each step: the bar lands at the same coordinates as the sheet's CTA in both the
sheet and floating states, the hero re-frames 523 -> 852 and back, and the bar
dips to nothing between the last ingredient and *Take it to go* rather than
showing both at once.

`mobile/` was driven at 393x852 through the react-native-web build. The collapse
and the burst are both too quick for screenshots, so they were checked frame by
frame off a recording of the run. Headless Chromium has no H.264, so on that
path the pour runs on its fallback timer — which is what verifies the fallback.
The web build plays the WebM, so its pour was driven off real playback.

Not verified: playback on a real device, and touch panning of the carousel.
Neither headless Chromium nor a simulator exercises real touch, so those want a
ten-second check on an actual phone.
