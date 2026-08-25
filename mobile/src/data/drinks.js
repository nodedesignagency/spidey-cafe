// Each drink drives both the carousel cup art and the ingredients named during
// the pour. One shared pour clip plays underneath, so the ingredient list is
// what makes each drink's build feel bespoke.
//
// `at` is where in the clip each ingredient is announced, as a fraction of the
// video's own runtime — not wall-clock — so the chips track what is actually
// happening on screen. The clip's beats: the stream starts around 0.05, the cup
// is half full by 0.39, full with the cream landing by 0.59, finished by 0.79.
// So the liquids get called out while it is filling, and the cream lands at 0.60.

export const drinks = [
  {
    id: 'vanilla-silk',
    name: 'Vanilla silk',
    tagline: 'Smooth, quiet, dangerous',
    liquid: ['#E8D5B8', '#D4B896'],
    cream: '#FFF8EE',
    drizzle: '#C9A227',
    ingredients: [
      { label: 'Vanilla bean', color: '#E8D5B8', at: 0.02 },
      { label: 'Steamed milk', color: '#FFF8EE', at: 0.18 },
      { label: 'Ice', color: '#DDEAF0', at: 0.36 },
      { label: 'Whipped cream', color: '#FFFDF8', at: 0.6 },
    ],
  },
  {
    id: 'caramel-swing',
    name: 'Caramel swing',
    tagline: 'Sticky landing',
    liquid: ['#C88A4A', '#A6672F'],
    cream: '#FFF3E2',
    drizzle: '#8A4B12',
    ingredients: [
      { label: 'Espresso', color: '#3B2016', at: 0.02 },
      { label: 'Caramel', color: '#C8792B', at: 0.18 },
      { label: 'Ice', color: '#DDEAF0', at: 0.36 },
      { label: 'Whipped cream', color: '#FFF3E2', at: 0.6 },
    ],
  },
  {
    id: 'double-chocochip',
    name: 'Double chocochip',
    tagline: 'Twice the bite',
    liquid: ['#6B4030', '#3E2318'],
    cream: '#F6E7D8',
    drizzle: '#2B160E',
    ingredients: [
      { label: 'Cocoa', color: '#4A2A1C', at: 0.02 },
      { label: 'Choco chips', color: '#241009', at: 0.14 },
      { label: 'Milk', color: '#FFF8EE', at: 0.28 },
      { label: 'Ice', color: '#DDEAF0', at: 0.44 },
      { label: 'Whipped cream', color: '#F6E7D8', at: 0.6 },
    ],
  },
  {
    id: 'web-mocha',
    name: 'Web mocha',
    tagline: 'Spun to order',
    liquid: ['#5A3A2A', '#2E1A12'],
    cream: '#F2E3D0',
    drizzle: '#1C0F08',
    ingredients: [
      { label: 'Espresso', color: '#2E1A12', at: 0.02 },
      { label: 'Dark cocoa', color: '#3A1F14', at: 0.18 },
      { label: 'Milk', color: '#FFF8EE', at: 0.36 },
      { label: 'Whipped cream', color: '#F2E3D0', at: 0.6 },
    ],
  },
  {
    id: 'midnight-venom',
    name: 'Midnight venom',
    tagline: 'Bites back',
    liquid: ['#2A2140', '#120E1F'],
    cream: '#E6E0F2',
    drizzle: '#0A0713',
    ingredients: [
      { label: 'Black cold brew', color: '#120E1F', at: 0.02 },
      { label: 'Blackberry', color: '#3B1D48', at: 0.18 },
      { label: 'Ice', color: '#DDEAF0', at: 0.36 },
      { label: 'Whipped cream', color: '#E6E0F2', at: 0.6 },
    ],
  },
]

export const DEFAULT_INDEX = 2 // Double chocochip, matching the Figma frame
