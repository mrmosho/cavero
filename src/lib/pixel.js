/**
 * Meta Pixel — Pixel ID: 1706528120358805
 * Tracks: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase
 */

const PIXEL_ID = '1706528120358805'

export function initPixel() {
  if (typeof window === 'undefined' || window.fbq) return
  ;(function(f,b,e,v,n,t,s){
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  })(window,document,'script','https://connect.facebook.net/en_US/fbevents.js')
  window.fbq('init', PIXEL_ID)
  window.fbq('track', 'PageView')
}

export function pixelPageView() {
  if (!window.fbq) return
  window.fbq('track', 'PageView')
}

export function pixelViewContent({ name, slug, price, category }) {
  if (!window.fbq) return
  window.fbq('track', 'ViewContent', {
    content_name:     name,
    content_ids:      [slug],
    content_type:     'product',
    content_category: category,
    value:            price,
    currency:         'EGP',
  })
}

export function pixelAddToCart({ name, slug, price, qty = 1 }) {
  if (!window.fbq) return
  window.fbq('track', 'AddToCart', {
    content_name:  name,
    content_ids:   [slug],
    content_type:  'product',
    value:         price * qty,
    currency:      'EGP',
    num_items:     qty,
  })
}

export function pixelInitiateCheckout({ cart, total }) {
  if (!window.fbq) return
  window.fbq('track', 'InitiateCheckout', {
    content_ids:  cart.map(i => i.slug),
    content_type: 'product',
    num_items:    cart.reduce((s, i) => s + i.qty, 0),
    value:        total,
    currency:     'EGP',
  })
}

export function pixelPurchase({ orderId, total, cart }) {
  if (!window.fbq) return
  window.fbq('track', 'Purchase', {
    content_ids:  cart.map(i => i.slug),
    content_type: 'product',
    num_items:    cart.reduce((s, i) => s + i.qty, 0),
    value:        total,
    currency:     'EGP',
    order_id:     orderId,
  })
}