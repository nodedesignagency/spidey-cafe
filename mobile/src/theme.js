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
  ctaW: 350,
  ctaH: 56,
  ctaBottom: 20,
  ctaRadius: 51.2,
  ctaTextSize: 18,
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
