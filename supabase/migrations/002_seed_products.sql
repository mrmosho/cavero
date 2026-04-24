-- ═══════════════════════════════════════════════════════════
-- CAVERO — Seed Products
-- Run after 001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════

insert into products (slug, name, price, category, label, description, details, badge, available, sort_order) values
(
  'lune-vase', 'The Lune Vase', 450, 'vases', 'Vases',
  'A minimal toroidal vase with a perfectly balanced negative space at its centre. Wheel-thrown and hand-finished in our Cairo studio. Suitable for dried or fresh stems.',
  'Made from high-quality resin, hand-poured and finished in our Cairo studio. Each piece is unique — minor variations in texture and finish are a sign of the handmade process, not a defect. Height: 22cm. Width: 18cm.',
  'new', true, 1
),
(
  'arch-stand', 'The Arch Stand', 380, 'desk', 'Desk Objects',
  'A sculptural headphone or book stand with a clean arched profile. Solid resin construction, weighted base, non-slip felt underside.',
  'Solid resin, weighted with sand for stability. Non-slip felt underside. Height: 28cm. Max load: 1kg. Available in all Cavero colours.',
  null, true, 2
),
(
  'duo-statue', 'The Duo — Couple Piece', 550, 'gifts', 'Gifts',
  'Two intertwined figures, custom-made for you. Choose body types, hair, skin tones. A piece that tells your story. Add a personalisation note at checkout.',
  'Made to order with full customisation. Please include your personalisation details in the notes field at checkout. Production time: 7–10 days. Height: 24cm.',
  'custom', true, 3
),
(
  'wave-vase', 'The Wave Vase', 380, 'vases', 'Vases',
  'An undulating vessel that casts dramatic shadows in afternoon light. The irregular organic form makes each piece unique.',
  'Hand-cast resin, undulating profile. Each piece is unique — no two wave patterns are identical. Height: 26cm. Suitable for dried stems only.',
  null, true, 4
),
(
  'facet-holder', 'The Facet Holder', 240, 'desk', 'Desk Objects',
  'A geometric pen and card holder with faceted faces that catch the light. Sits beautifully on any clean desk setup.',
  'Solid resin, geometric faceted form. Internal diameter: 4cm. Height: 12cm. Fits standard pens, pencils, and business cards.',
  null, true, 5
),
(
  'luna-light', 'The Luna Light', 420, 'lighting', 'Lighting',
  'A half-sphere ambient lamp that diffuses warm light evenly through a matte plaster shell. USB-C powered.',
  'Matte plaster shell, warm white LED (2700K, non-replaceable). USB-C powered (cable included). Diameter: 18cm. Not suitable for direct sunlight.',
  'new', true, 6
),
(
  'ridge-planter', 'The Ridge Planter', 320, 'vases', 'Vases',
  'A ribbed cylindrical planter with a drainage plug and saucer. Sized for succulents, herbs, or statement plants.',
  'Ribbed resin cylinder with removable drainage plug and matching saucer. Internal diameter: 14cm. Height: 18cm. Suitable for plants up to 30cm.',
  null, true, 7
),
(
  'column-candle', 'Column Candle Holder', 180, 'decor', 'Decor',
  'A slender tapered column for pillar candles. Cast in matte concrete with a bronze-dusted base. 22cm tall.',
  'Matte concrete finish, bronze-dusted base. Height: 22cm. Fits standard 5cm diameter pillar candles. Wipe clean only.',
  null, true, 8
);

-- Seed colour variants for all products
insert into product_variants (product_id, name, value, available)
select p.id, v.name, v.value, true
from products p
cross join (values
  ('Charcoal', 'charcoal'),
  ('Cream',    'cream'),
  ('Bronze',   'bronze'),
  ('Stone',    'stone'),
  ('White',    'white')
) as v(name, value);
