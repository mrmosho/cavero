export const PRODUCTS = [
  { slug:'lune-vase',     name:'The Lune Vase',          price:450,  category:'vases',    label:'Vases',        badge:'new',    available:true, customisable:false, sort_order:1, description:'A minimal toroidal vase with a perfectly balanced negative space at its centre. Wheel-thrown and hand-finished in our Cairo studio.', details:'Made from high-quality resin, hand-poured and finished in our Cairo studio. Height: 22cm. Width: 18cm.' },
  { slug:'arch-stand',    name:'The Arch Stand',          price:380,  category:'desk',     label:'Desk Objects', badge:null,     available:true, customisable:false, sort_order:2, description:'A sculptural headphone or book stand with a clean arched profile. Solid resin construction, weighted base, non-slip felt underside.', details:'Solid resin, weighted with sand for stability. Non-slip felt underside. Height: 28cm.' },
  { slug:'duo-statue',    name:'The Duo — Couple Piece',  price:550,  category:'gifts',    label:'Gifts',        badge:'custom', available:true, customisable:true,  sort_order:3, description:'Two intertwined figures, custom-made for you. Choose body types, hair, skin tones. A piece that tells your story.', details:'Made to order with full customisation. Production time: 7–10 days. Height: 24cm.' },
  { slug:'wave-vase',     name:'The Wave Vase',           price:380,  category:'vases',    label:'Vases',        badge:null,     available:true, customisable:false, sort_order:4, description:'An undulating vessel that casts dramatic shadows in afternoon light. The irregular organic form makes each piece unique.', details:'Hand-cast resin, undulating profile. Height: 26cm. Suitable for dried stems only.' },
  { slug:'facet-holder',  name:'The Facet Holder',        price:240,  category:'desk',     label:'Desk Objects', badge:null,     available:true, customisable:false, sort_order:5, description:'A geometric pen and card holder with faceted faces that catch the light.', details:'Solid resin, geometric faceted form. Internal diameter: 4cm. Height: 12cm.' },
  { slug:'luna-light',    name:'The Luna Light',          price:420,  category:'lighting', label:'Lighting',     badge:'new',    available:true, customisable:false, sort_order:6, description:'A half-sphere ambient lamp that diffuses warm light evenly through a matte plaster shell. USB-C powered.', details:'Matte plaster shell, warm white LED 2700K. USB-C powered. Diameter: 18cm.' },
  { slug:'ridge-planter', name:'The Ridge Planter',       price:320,  category:'vases',    label:'Vases',        badge:null,     available:true, customisable:false, sort_order:7, description:'A ribbed cylindrical planter with a drainage plug and saucer.', details:'Ribbed resin cylinder with removable drainage plug and matching saucer. Internal diameter: 14cm. Height: 18cm.' },
  { slug:'column-candle', name:'Column Candle Holder',    price:180,  category:'decor',    label:'Decor',        badge:null,     available:true, customisable:false, sort_order:8, description:'A slender tapered column for pillar candles. Cast in matte concrete with a bronze-dusted base.', details:'Matte concrete finish, bronze-dusted base. Height: 22cm.' },
]

export const PRODUCT_COLOURS = [
  { name:'Charcoal', value:'charcoal', hex:'#2D2B34' },
  { name:'Cream',    value:'cream',    hex:'#D4CFC0' },
  { name:'Bronze',   value:'bronze',   hex:'#A8956F' },
  { name:'Stone',    value:'stone',    hex:'#B8B5A8' },
  { name:'White',    value:'white',    hex:'#F5F3EF' },
]

export const REVIEWS = [
  { stars:5, text:'"I ordered the couple statue for our anniversary. My partner cried. Nothing like it anywhere else in Cairo."', author:'Mariam A.', product:'The Duo' },
  { stars:5, text:'"The vase looks like something from a design store in Europe. The packaging alone was a whole experience."', author:'Karim T.', product:'The Lune Vase' },
  { stars:5, text:'"Bought the headphone stand for my desk. Everyone who visits asks where I got it. Premium in every way."', author:'Ahmed M.', product:'The Arch Stand' },
]

export function getProductBySlug(slug) { return PRODUCTS.find(p => p.slug === slug) || null }
