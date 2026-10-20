/**
 * Pixel art is stored as character grids: one char per pixel, '.' is transparent,
 * every other char is looked up in the palette. Keep every row of a frame the same width.
 */
export interface Sprite {
  frames: string[][]
  palette?: Record<string, string>
}

export const basePalette: Record<string, string> = {
  K: '#0b0d12', // ink outline
  W: '#f4f6f8',
  w: '#c7ced8',
  S: '#6b7280',
  s: '#3a404c',
  T: '#11161d', // terminal screen
  G: '#7bf542',
  g: '#3c8c18',
  V: '#a78bfa',
  v: '#6d28d9',
  B: '#4da3ff',
  b: '#1e4f9c',
  C: '#6dc9f5',
  c: '#2a8bb8',
  Y: '#ffd23f',
  y: '#c98a00',
  O: '#f5a623',
  R: '#ff5c5c',
  r: '#a8232c',
  P: '#f2c79b',
  p: '#c98f62',
  N: '#a0642c',
  n: '#5e3a17',
  H: '#efe3c2',
  h: '#b8a57c',
  E: '#fff36b',
  D: '#2c3e74',
}

export function mirror(frame: string[]): string[] {
  return frame.map((row) => row.split('').reverse().join(''))
}

export function recolor(frame: string[], map: Record<string, string>): string[] {
  return frame.map((row) =>
    row
      .split('')
      .map((ch) => map[ch] ?? ch)
      .join(''),
  )
}

/* ---------------- Characters ---------------- */

const heroTop = [
  '................',
  '.....KKKKKK.....',
  '....KVVVVVVK....',
  '...KVVVVVVVvK...',
  '...KVVPPPPPvK...',
  '...KVPPPPPPPK...',
  '...KVPPKPPKPK...',
  '...KVPPPPPPpK...',
  '....KPPPPPpK....',
  '...KKVVGGVVKK...',
  '..KVVVVGGVVVvK..',
  '..KPKVVVVVVKPK..',
  '...KKDDDDDDKK...',
]

const heroLegsStand = ['....KDDKKDDK....', '....KDDKKDDK....', '...KSSSKKSSSK...']
const heroLegsStride = ['...KDDKKKKDDK...', '..KDDK....KDDK..', '..KSSK....KSSK..']
const heroLegsPass = ['....KDDKKDDK....', '.....KDDDDK.....', '.....KSSSSK.....']

function darken(hex: string, amount = 0.35) {
  const n = parseInt(hex.replace('#', ''), 16)
  const channel = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount))
  return `#${[16, 8, 0].map((s) => channel(s).toString(16).padStart(2, '0')).join('')}`
}

/** The hero with the hoodie recoloured: gives every player a distinct pixel character. */
export function tintedHero(color: string): Sprite {
  return {
    frames: [[...heroTop, ...heroLegsStand].map((row) => row.replace(/V/g, 'A').replace(/v/g, 'a'))],
    palette: { A: color, a: darken(color) },
  }
}

export const hero: Sprite = {
  frames: [
    [...heroTop, ...heroLegsStand],
    [...heroTop, ...heroLegsStand],
  ],
}

export const heroRun: Sprite = {
  frames: [
    [...heroTop, ...heroLegsStride],
    [...heroTop, ...heroLegsPass],
  ],
}

const botOpen = [
  '.......KK.......',
  '......KGGK......',
  '.......KK.......',
  '...KKKKKKKKKK...',
  '..KwwwwwwwwwwK..',
  '..KwKKKKKKKKwK..',
  '..KwKGGKKVVKwK..',
  '..KwKGGKKVVKwK..',
  '..KwKKKKKKKKwK..',
  '..KwwwwwwwwwwK..',
  '..KwwwKKKKwwwK..',
  '...KKKKKKKKKK...',
  '....KsVVVVsK....',
  '...KsVVGGVVsK...',
  '...KsVVVVVVsK...',
  '....KKKKKKKK....',
]

const botBlink = botOpen.map((row, i) => (i === 6 ? '..KwKKKKKKKKwK..' : row))

export const questBot: Sprite = {
  frames: [botOpen, botOpen, botOpen, botOpen, botBlink, botOpen, recolor(botOpen, { G: 'Y' })],
}

const bossFrame = [
  '...KK..............KK...',
  '..KHHK............KHHK..',
  '..KHhK............KhHK..',
  '...KHhK..........KhHK...',
  '....KhhKKKKKKKKKKhhK....',
  '....KRRRRRRRRRRRRRRK....',
  '...KRRRRRRRRRRRRRRRRK...',
  '..KRRWWWWRRRRRRWWWWRRK..',
  '..KRRWEEKRRRRRRKEEWRRK..',
  '..KRRWEKKRRRRRRKKEWRRK..',
  '..KRRRWWWRRRRRRWWWRRRK..',
  '.KRRRRRRRRRRRRRRRRRRRRK.',
  '.KRRRKKKKKKKKKKKKKKRRRK.',
  '.KRRRKWKKWKKWKKWKKKRRRK.',
  '.KRRRRKKKKKKKKKKKKRRRRK.',
  'KrRRRRRRRVVVVVVRRRRRRRrK',
  'KrRRRRRRRVKKKKVRRRRRRRrK',
  'KrrRRRRRRVKVVKVRRRRRRrrK',
  'KrrRRRRRRVKVVKVRRRRRRrrK',
  'KrrrRRRRRVKKKKVRRRRRrrrK',
  '.KrrrRRRRVVVVVVRRRRrrrK.',
  '..KKrrrrrrrrrrrrrrrrKK..',
  '...KrrrK........KrrrK...',
  '...KKKKK........KKKKK...',
]

export const recursionBoss: Sprite = {
  frames: [bossFrame, recolor(bossFrame, { E: 'O' }), bossFrame, recolor(bossFrame, { E: 'W', V: 'G' })],
}

const slimeA = [
  '....KKKK....',
  '..KKVVVVKK..',
  '.KVVWVVVVVK.',
  'KVVWVVVVVVvK',
  'KVVKKVVKKVvK',
  'KVVKWVVKWVvK',
  'KVVVVVVVVVvK',
  'KvVVVVVVVvvK',
  '.KKKKKKKKKK.',
]
const slimeB = [
  '............',
  '....KKKK....',
  '.KKKVVVVKKK.',
  'KVVWVVVVVVvK',
  'KVVKKVVKKVvK',
  'KVVKWVVKWVvK',
  'KVVVVVVVVVvK',
  'KvVVVVVVVvvK',
  'KKKKKKKKKKKK',
]

export const slime: Sprite = { frames: [slimeA, slimeB] }
export const bugSlime: Sprite = {
  frames: [recolor(slimeA, { V: 'G', v: 'g' }), recolor(slimeB, { V: 'G', v: 'g' })],
}

/* ---------------- Items & icons ---------------- */

const coinFace = [
  '..KKKK..',
  '.KYYYYK.',
  'KYWYYYyK',
  'KYWYYYyK',
  'KYYYYYyK',
  'KYYYYyyK',
  '.KyyyyK.',
  '..KKKK..',
]
const coinNarrow = [
  '...KK...',
  '..KYYK..',
  '..KWYK..',
  '..KWYK..',
  '..KYYK..',
  '..KYyK..',
  '..KyyK..',
  '...KK...',
]
const coinEdge = [
  '...KK...',
  '...Ky...',
  '...Ky...',
  '...Ky...',
  '...Ky...',
  '...Ky...',
  '...Ky...',
  '...KK...',
]

export const coin: Sprite = { frames: [coinFace, coinNarrow, coinEdge, mirror(coinNarrow)] }

export const heart: Sprite = {
  frames: [
    [
      '.KK...KK.',
      'KRWK.KRRK',
      'KRRRKRRRK',
      'KRRRRRRrK',
      '.KRRRRrK.',
      '..KRRrK..',
      '...KrK...',
      '....K....',
    ],
  ],
}

const flameA = [
  '....KK....',
  '...KOOK...',
  '...KOOK.K.',
  '..KOYYOKOK',
  '..KOYYOOOK',
  '.KOYYWYOOK',
  '.KOYWWYYOK',
  'KOYYWWWYOK',
  'KOYYWWYYOK',
  'KROYYYYORK',
  '.KRROOORK.',
  '..KKKKKK..',
]

export const flame: Sprite = { frames: [flameA, mirror(flameA)] }

const chestClosed = [
  '..KKKKKKKKKK..',
  '.KNNNNYYNNNNK.',
  'KNNNNNYYNNNNNK',
  'KnnnnnYYnnnnnK',
  'KKKKKKYYKKKKKK',
  'KNNNNKYYKNNNNK',
  'KNNNNKyyKNNNNK',
  'KNNNNNKKNNNNNK',
  'KnnnnnYYnnnnnK',
  'KnnnnnYYnnnnnK',
  'KKKKKKKKKKKKKK',
]
const chestOpen = [
  '.KKKKKKKKKKKK.',
  'KnnnnnnnnnnnnK',
  'KNNNNNYYNNNNNK',
  'KKKKKKKKKKKKKK',
  'KYWYYWYYWYYWYK',
  'KKKKKKYYKKKKKK',
  'KNNNNKYYKNNNNK',
  'KNNNNKyyKNNNNK',
  'KnnnnnYYnnnnnK',
  'KnnnnnYYnnnnnK',
  'KKKKKKKKKKKKKK',
]

export const chest: Sprite = { frames: [chestClosed] }
export const chestOpened: Sprite = { frames: [chestOpen] }

export const trophy: Sprite = {
  frames: [
    [
      '..KKKKKKKK..',
      'KKKYYWYYYKKK',
      'KYKYWYYYyKYK',
      'KYKYYYYYyKYK',
      '.KKYYYYYyKK.',
      '..KYYYYyyK..',
      '...KYYyyK...',
      '....KyyK....',
      '....KYyK....',
      '...KKYyKK...',
      '..KYYYYyyK..',
      '..KKKKKKKK..',
    ],
  ],
}

export const gem: Sprite = {
  frames: [
    ['..KKKKKK..', '.KCWCCCCK.', 'KCWCCCCCcK', 'KccccccccK', '.KCCCCCcK.', '..KCCCcK..', '...KCcK...', '....KK....'],
  ],
}

const starFrame = [
  '....K....',
  '...KYK...',
  'KKKKYKKKK',
  'KYYYWYYyK',
  '.KYYYYyK.',
  '..KYYYK..',
  '.KYYKyyK.',
  '.KyK.KyK.',
  '.KK...KK.',
]

export const star: Sprite = { frames: [starFrame, recolor(starFrame, { W: 'Y', Y: 'E' })] }

export const sword: Sprite = {
  frames: [
    [
      '..........KK',
      '.........KWK',
      '........KWwK',
      '.......KWwK.',
      '......KWwK..',
      '.KK..KWwK...',
      '.KYKKWwK....',
      '..KYYwK.....',
      '..KNYYK.....',
      '.KNNKKYK....',
      'KNNK..KK....',
      'KKK.........',
    ],
  ],
}

export const book: Sprite = {
  frames: [
    [
      '.KKKKKKKKKK.',
      'KGGGGGGGGGGK',
      'KGGKKKKKKGGK',
      'KGGKWWWWKGGK',
      'KGGKKKKKKGGK',
      'KGGGGGGGGGGK',
      'KgggggggggGK',
      'KWWWWWWWWWgK',
      'KwwwwwwwwwKK',
      '.KKKKKKKKKK.',
    ],
  ],
}

const terminalFrame = [
  'KKKKKKKKKKKK',
  'KsRsYsGssssK',
  'KKKKKKKKKKKK',
  'KTTTTTTTTTTK',
  'KTGTTTTTTTTK',
  'KTTGTTTTTTTK',
  'KTGTTGGGTTTK',
  'KTTTTTTTTTTK',
  'KTTTTTTTTTTK',
  'KKKKKKKKKKKK',
]

const terminalCaretOff = terminalFrame.map((row, i) => (i === 6 ? 'KTGTTTTTTTTK' : row))

export const terminal: Sprite = { frames: [terminalFrame, terminalCaretOff] }

export const database: Sprite = {
  frames: [
    [
      '.KKKKKKKK.',
      'KCCWCCCCcK',
      'KKCCCCCCKK',
      'KBKKKKKKbK',
      'KBBBBBBBbK',
      'KKBBBBBBKK',
      'KBKKKKKKbK',
      'KBBBBBBBbK',
      'KKBBBBBBKK',
      'KBKKKKKKbK',
      'KBBBBBBBbK',
      '.KKKKKKKK.',
    ],
  ],
}

export const compass: Sprite = {
  frames: [
    [
      '...KKKKK...',
      '.KKyYYYyKK.',
      '.KYwwRwwYK.',
      'KYwwwRwwwyK',
      'KYwwwRwwwyK',
      'KYwwwYwwwyK',
      'KYwwwBwwwyK',
      'KYwwwBwwwyK',
      '.KYwwBwwyK.',
      '.KKyyyyyKK.',
      '...KKKKK...',
    ],
  ],
}

export const lightning: Sprite = {
  frames: [
    ['....KKKK', '...KYYK.', '..KYYK..', '.KYYK...', 'KYYYKKKK', 'KKKKYYYK', '...KYYK.', '..KYYK..', '..KYK...', '.KYK....', '.KK.....', '.K......'],
  ],
}

export const bug: Sprite = {
  frames: [
    [
      '..K......K..',
      '...K....K...',
      '....KKKK....',
      '...KssssK...',
      '..KKKKKKKK..',
      '.KGGGKKGGGK.',
      'KKGWGKKGGgKK',
      '.KGGGKKGGgK.',
      'KKGGGKKGGgKK',
      '.KgGGKKGGgK.',
      'KKKgGKKGgKKK',
      '..KKKKKKKK..',
    ],
  ],
}

export const floppy: Sprite = {
  frames: [
    [
      'KKKKKKKKK.',
      'KbKwwwKbbK',
      'KbKwwwKbbK',
      'KbKKKKKbbK',
      'KbbbbbbbbK',
      'KbWWWWWWbK',
      'KbWsssWWbK',
      'KbWWWWWWbK',
      'KbWssssWbK',
      'KKKKKKKKKK',
    ],
  ],
  palette: { b: '#7c5cd6' },
}

export const medal: Sprite = {
  frames: [
    [
      '.KRK..KBK.',
      '.KRRKKBBK.',
      '..KRRBBK..',
      '...KRBK...',
      '..KKKKKK..',
      '.KYYYYYyK.',
      'KYYWYYYyyK',
      'KYWYYYYYyK',
      'KYYYYYYyyK',
      'KYYYYYyyyK',
      '.KyyyyyyK.',
      '..KKKKKK..',
    ],
  ],
}

export const crown: Sprite = {
  frames: [
    [
      '.K...KK...K.',
      'KYK.KYYK.KYK',
      'KYYKYYYYKYYK',
      'KYYYYYYYYYYK',
      'KYYYYYYYYYyK',
      'KYRYYBYYGYyK',
      'KYYYYYYYYyyK',
      'KyyyyyyyyyyK',
      'KKKKKKKKKKKK',
    ],
  ],
}

export const lock: Sprite = {
  frames: [
    [
      '..KKKKKK..',
      '.KsKKKKsK.',
      '.KsK..KsK.',
      '.KsK..KsK.',
      'KKKKKKKKKK',
      'KYYYYYYYyK',
      'KYYYKKYYyK',
      'KYYYKKYYyK',
      'KYYYYKYYyK',
      'KYYYYYYYyK',
      'KyyyyyyyyK',
      'KKKKKKKKKK',
    ],
  ],
}

export const potion: Sprite = {
  frames: [
    ['..KKKK..', '..KNNK..', '..KKKK..', '...KK...', '..KwwK..', '.KVVVVK.', 'KVWVVVvK', 'KVVVVVvK', 'KVVVVvvK', '.KvvvvK.', '..KKKK..'],
  ],
}

export const castle: Sprite = {
  frames: [
    [
      '.....KGG....',
      '.....K......',
      'KKK.KKKK.KKK',
      'KwK.KwwK.KwK',
      'KwKKKwwKKKwK',
      'KwwwwwwwwwsK',
      'KwwKwwwwKwsK',
      'KwwKwwwwKwsK',
      'KwwwwwwwwwsK',
      'KwwwKKKKwwsK',
      'KwwKNNNNKwsK',
      'KwwKNNNNKwsK',
      'KKKKKKKKKKKK',
    ],
    [
      '.....KG.....',
      '.....KGG....',
      'KKK.KKKK.KKK',
      'KwK.KwwK.KwK',
      'KwKKKwwKKKwK',
      'KwwwwwwwwwsK',
      'KwwKwwwwKwsK',
      'KwwKwwwwKwsK',
      'KwwwwwwwwwsK',
      'KwwwKKKKwwsK',
      'KwwKNNNNKwsK',
      'KwwKNNNNKwsK',
      'KKKKKKKKKKKK',
    ],
  ],
}

export const treasureMap: Sprite = {
  frames: [
    [
      'KKKKKKKKKKKK',
      'KHHHhHHHhHHK',
      'KHRHhHHHhHHK',
      'KHHRhHHHhHHK',
      'KHHHRHHHRHRK',
      'KHHHhRHRhRHK',
      'KHHHhHRHRHRK',
      'KHHHhHHHhHHK',
      'KKKKKKKKKKKK',
    ],
  ],
}

export const scroll: Sprite = {
  frames: [
    [
      '.KKKKKKKKKK.',
      'KHhHHHHHHhHK',
      '.KKHHHHHHKK.',
      '..KHhhhhHK..',
      '..KHHHHHHK..',
      '..KHhhhHHK..',
      '..KHHHHHHK..',
      '..KHhhhhHK..',
      '.KKHHHHHHKK.',
      'KHhHHHHHHhHK',
      '.KKKKKKKKKK.',
    ],
  ],
}

export const gear: Sprite = {
  frames: [
    [
      '....KKKK....',
      '.KK.KwwK.KK.',
      'KwwKKwwKKwsK',
      'KwwwwwwwwwsK',
      '.KwwwKKwwsK.',
      'KKwwK..KwsKK',
      'KwwwK..KwssK',
      '.KwwwKKwwsK.',
      'KwwwwwwwwssK',
      'KwsKKwsKKssK',
      '.KK.KssK.KK.',
      '....KKKK....',
    ],
  ],
}

export const resume: Sprite = {
  frames: [
    [
      'KKKKKKKK..',
      'KWWWWWWKK.',
      'KWssWWWKwK',
      'KWssWWWKKK',
      'KWWWWWWWWK',
      'KWSSSSSSWK',
      'KWWWWWWWWK',
      'KWSSSSSWWK',
      'KWWWWWWWWK',
      'KWGGGGGGWK',
      'KWWWWWWWWK',
      'KKKKKKKKKK',
    ],
  ],
}

export const briefcase: Sprite = {
  frames: [
    [
      '....KKKK....',
      '...KnnnnK...',
      '...Kn..nK...',
      'KKKKKKKKKKKK',
      'KNNNNNNNNNNK',
      'KNhNNNNNNNNK',
      'KnnnnKKnnnnK',
      'KNNNKYYKNNNK',
      'KNNNNKKNNNNK',
      'KNNNNNNNNNNK',
      'KKKKKKKKKKKK',
    ],
  ],
}

export const sprites = {
  hero,
  heroRun,
  questBot,
  recursionBoss,
  slime,
  bugSlime,
  coin,
  heart,
  flame,
  chest,
  chestOpened,
  trophy,
  gem,
  star,
  sword,
  book,
  terminal,
  database,
  compass,
  lightning,
  bug,
  floppy,
  medal,
  crown,
  lock,
  potion,
  castle,
  treasureMap,
  scroll,
  gear,
  resume,
  briefcase,
} satisfies Record<string, Sprite>

export type SpriteName = keyof typeof sprites

export function isSpriteName(name: string): name is SpriteName {
  return name in sprites
}
