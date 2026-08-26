// Values taken from the Figma frame (node 0:102), which is drawn at 393pt wide.
// Anything positional is multiplied by `scale(width)` so the proportions hold on
// other handsets instead of drifting.
export const REF_W = 393

export const theme = {
  ink: '#3c2c21', // title, drink name and CTA fill are all this one brown
  sheet: '#ffffff',
  backdrop: '#c2b09d', // frame colour behind the hero
  heroFallback: '#e8dcc8',
  ctaPress: '#2d2018',
  ctaDone: '#5a4433', // lifts a shade when the drink has been taken
  ctaFill: '#63564d', // the pour sweep, per the redrawn button
  ctaRing: '#ffffff', // invisible against the sheet, and only shows once it drops
}

export const spec = {
  sheetH: 369,
  sheetRadius: 40,
  titleTop: 32,
  titleSize: 20,
  carouselTop: 64,
  cupBox: 176, // tallest cup in the row (height)
  cupBoxW: 172, // and its width
  // Natural aspect of the generated cut-outs (width / height). They are taller
  // than the frame's near-square cup boxes, so width follows from the row height.
  cupAspect: 0.504,
  nameTop: 253, // 50% of the sheet + 68.5, per the frame
  nameSize: 14,
  // The button is the one place that no longer comes from node 0:102. It was
  // redrawn (node 26:71) as a compact ringed pill: about half the screen wide
  // rather than edge to edge, with a white ring around it. Measured off that
  // frame two ways - against its phone width, and against the 125pt Dynamic
  // Island in its status bar - which agreed to within a couple of points.
  ctaW: 186,
  ctaH: 52,
  ctaBottom: 20, // of the pill; the ring sits 7.5 outside that
  ctaRing: 7.5,
  ctaRadius: 26, // half the height - a stadium, as drawn
  ctaTextSize: 18,
  // Long ingredient names have to survive the narrower pill, so the pour label
  // runs a size down from the CTA labels.
  pourTextSize: 16,
  // Cup widths at 0, 1 and 2 steps from centre, and the overlap between them.
  cupScales: [1, 132.909 / 172, 103.571 / 172],
  // The frame's cup centres sit at x = 7.8, 85.0, 196.5, 307.9, 385.2 — steps of
  // 77.2, 111.5, 111.5, 77.2, because the cups differ in width. A snap carousel
  // needs one uniform step, so this is that span averaged over the four gaps,
  // which reproduces those centre positions to within a couple of points.
  cupStep: 94.35,
  cupOverlap: 41,
  sideOpacity: 0.2,
}

// The sheet drops away faster than the photo opens, so the hero is still
// settling once the white is gone - the picture takes the screen rather than
// the two moving as one block.
export const motion = {
  collapse: 380, // sheet shrinks and drops off the bottom
  bleed: 620, // hero re-frames from behind-the-sheet to full screen
  restore: 520, // sheet springs back up once the drink has been taken
}

export const scale = (width) => width / REF_W
