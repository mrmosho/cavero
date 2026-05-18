-- ═══════════════════════════════════════════════════════════
-- CAVERO — Seed Products
-- Run AFTER 001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════

insert into products (slug, name, price, category, label, description, details, badge, available, customisable, sort_order) values
('lune-vase',     'The Lune Vase',          450, 'vases',    'Vases',        'A minimal toroidal vase with a perfectly balanced negative space at its centre. Wheel-thrown and hand-finished in our Cairo studio.', 'Made from high-quality resin, hand-poured and finished in our Cairo studio. Height: 22cm. Width: 18cm.', 'new',    true, false, 1),
('arch-stand',    'The Arch Stand',          380, 'desk',     'Desk Objects', 'A sculptural headphone or book stand with a clean arched profile. Solid resin construction, weighted base, non-slip felt underside.', 'Solid resin, weighted with sand for stability. Non-slip felt underside. Height: 28cm.', null,   true, false, 2),
('duo-statue',    'The Duo — Couple Piece',  550, 'gifts',    'Gifts',        'Two intertwined figures, custom-made for you. Choose body types, hair, skin tones. A piece that tells your story.', 'Made to order with full customisation. Production time: 7-10 days. Height: 24cm.', 'custom', true, true,  3),
('wave-vase',     'The Wave Vase',           380, 'vases',    'Vases',        'An undulating vessel that casts dramatic shadows in afternoon light. The irregular organic form makes each piece unique.', 'Hand-cast resin, undulating profile. Height: 26cm. Suitable for dried stems only.', null,   true, false, 4),
('facet-holder',  'The Facet Holder',        240, 'desk',     'Desk Objects', 'A geometric pen and card holder with faceted faces that catch the light.', 'Solid resin, geometric faceted form. Internal diameter: 4cm. Height: 12cm.', null,   true, false, 5),
('luna-light',    'The Luna Light',          420, 'lighting', 'Lighting',     'A half-sphere ambient lamp that diffuses warm light evenly through a matte plaster shell. USB-C powered.', 'Matte plaster shell, warm white LED 2700K. USB-C powered. Diameter: 18cm.', 'new',    true, false, 6),
('ridge-planter', 'The Ridge Planter',       320, 'vases',    'Vases',        'A ribbed cylindrical planter with a drainage plug and saucer.', 'Ribbed resin cylinder with removable drainage plug and matching saucer. Internal diameter: 14cm. Height: 18cm.', null,   true, false, 7),
('column-candle', 'Column Candle Holder',    180, 'decor',    'Decor',        'A slender tapered column for pillar candles. Cast in matte concrete with a bronze-dusted base.', 'Matte concrete finish, bronze-dusted base. Height: 22cm.', null,   true, false, 8);

-- Seed colour variants for all products
insert into product_variants (product_id, name, hex, available, sort_order)
select p.id, v.name, v.hex, true, v.ord
from products p
cross join (values
  ('Charcoal', '#2D2B34', 1),
  ('Cream',    '#D4CFC0', 2),
  ('Bronze',   '#A8956F', 3),
  ('Stone',    '#B8B5A8', 4),
  ('White',    '#F5F3EF', 5)
) as v(name, hex, ord);
