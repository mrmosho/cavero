/**
 * Product data — single source of truth
 *
 * SVG illustrations are decoupled from product records.
 * When products are loaded from Supabase, the slug is used
 * to look up the illustration in ProductIllustration.jsx.
 *
 * Price is in whole EGP integers.
 */

export const PRODUCTS = [
  {
    slug:        'lune-vase',
    name:        'The Lune Vase',
    price:       450,
    category:    'vases',
    label:       'Vases',
    badge:       'new',
    available:   true,
    description: 'A minimal toroidal vase with a perfectly balanced negative space at its centre. Wheel-thrown and hand-finished in our Cairo studio. Suitable for dried or fresh stems.',
    details:     'Made from high-quality resin, hand-poured and finished in our Cairo studio. Each piece is unique — minor variations in texture and finish are a sign of the handmade process, not a defect. Height: 22cm. Width: 18cm.',
    sort_order:  1,
  },
  {
    slug:        'arch-stand',
    name:        'The Arch Stand',
    price:       380,
    category:    'desk',
    label:       'Desk Objects',
    badge:       null,
    available:   true,
    description: 'A sculptural headphone or book stand with a clean arched profile. Solid resin construction, weighted base, non-slip felt underside.',
    details:     'Solid resin, weighted with sand for stability. Non-slip felt underside. Height: 28cm. Max load: 1kg. Available in all Cavero colours.',
    sort_order:  2,
  },
  {
    slug:        'duo-statue',
    name:        'The Duo — Couple Piece',
    price:       550,
    category:    'gifts',
    label:       'Gifts',
    badge:       'custom',
    available:   true,
    description: 'Two intertwined figures, custom-made for you. Choose body types, hair, skin tones. A piece that tells your story. Add a personalisation note at checkout.',
    details:     'Made to order with full customisation. Please include your personalisation details in the notes field at checkout. Production time: 7–10 days. Height: 24cm.',
    sort_order:  3,
  },
  {
    slug:        'wave-vase',
    name:        'The Wave Vase',
    price:       380,
    category:    'vases',
    label:       'Vases',
    badge:       null,
    available:   true,
    description: 'An undulating vessel that casts dramatic shadows in afternoon light. The irregular organic form makes each piece unique.',
    details:     'Hand-cast resin, undulating profile. Each piece is unique — no two wave patterns are identical. Height: 26cm. Suitable for dried stems only.',
    sort_order:  4,
  },
  {
    slug:        'facet-holder',
    name:        'The Facet Holder',
    price:       240,
    category:    'desk',
    label:       'Desk Objects',
    badge:       null,
    available:   true,
    description: 'A geometric pen and card holder with faceted faces that catch the light. Sits beautifully on any clean desk setup.',
    details:     'Solid resin, geometric faceted form. Internal diameter: 4cm. Height: 12cm. Fits standard pens, pencils, and business cards.',
    sort_order:  5,
  },
  {
    slug:        'luna-light',
    name:        'The Luna Light',
    price:       420,
    category:    'lighting',
    label:       'Lighting',
    badge:       'new',
    available:   true,
    description: 'A half-sphere ambient lamp that diffuses warm light evenly through a matte plaster shell. USB-C powered.',
    details:     'Matte plaster shell, warm white LED (2700K, non-replaceable). USB-C powered (cable included). Diameter: 18cm. Not suitable for direct sunlight.',
    sort_order:  6,
  },
  {
    slug:        'ridge-planter',
    name:        'The Ridge Planter',
    price:       320,
    category:    'vases',
    label:       'Vases',
    badge:       null,
    available:   true,
    description: 'A ribbed cylindrical planter with a drainage plug and saucer. Sized for succulents, herbs, or statement plants.',
    details:     'Ribbed resin cylinder with removable drainage plug and matching saucer. Internal diameter: 14cm. Height: 18cm. Suitable for plants up to 30cm.',
    sort_order:  7,
  },
  {
    slug:        'column-candle',
    name:        'Column Candle Holder',
    price:       180,
    category:    'decor',
    label:       'Decor',
    badge:       null,
    available:   true,
    description: 'A slender tapered column for pillar candles. Cast in matte concrete with a bronze-dusted base. 22cm tall.',
    details:     'Matte concrete finish, bronze-dusted base. Height: 22cm. Fits standard 5cm diameter pillar candles. Wipe clean only.',
    sort_order:  8,
  },
]

export const PRODUCT_COLOURS = [
  { name: 'Charcoal', value: 'charcoal', hex: '#2D2B34' },
  { name: 'Cream',    value: 'cream',    hex: '#D4CFC0' },
  { name: 'Bronze',   value: 'bronze',   hex: '#A8956F' },
  { name: 'Stone',    value: 'stone',    hex: '#B8B5A8' },
  { name: 'White',    value: 'white',    hex: '#F5F3EF' },
]

export const REVIEWS = [
  {
    stars:   5,
    text:    '"I ordered the couple statue for our anniversary. My partner cried. It\'s beautiful — nothing like it anywhere else in Cairo."',
    author:  'Mariam A.',
    product: 'The Duo',
  },
  {
    stars:   5,
    text:    '"The vase looks like something from a design store in Europe. The packaging alone was a whole experience. Will order again."',
    author:  'Karim T.',
    product: 'The Lune Vase',
  },
  {
    stars:   5,
    text:    '"Bought the headphone stand for my desk. Everyone who visits asks where I got it. Quality feels premium in every way."',
    author:  'Ahmed M.',
    product: 'The Arch Stand',
  },
]

// Helper
export function getProductBySlug(slug) {
  return PRODUCTS.find(p => p.slug === slug) || null
}

export function getProductsByCategory(category) {
  return PRODUCTS.filter(p => p.category === category && p.available)
}
