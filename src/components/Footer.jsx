import { Link } from 'react-router-dom'
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <img src="/logo_reverse.png" alt="Cavero" style={{ height: 36, width: 'auto', marginBottom: 16 }} />
            <div className="footer__divider"/>
            <p className="footer__brand-desc">Studio-crafted home objects, made to order. Every piece is designed with intention and made after you place your order. Based in Cairo, Egypt.</p>
            <div style={{ marginTop:28, display:'flex', gap:20 }}>
              <a href="https://www.instagram.com/caveroegy?igsh=cTU5M2ZscW1pcng2" target="_blank" rel="noreferrer" className="footer__social-link">Instagram</a>
              <a href="https://www.tiktok.com/@caveroegy" target="_blank" rel="noreferrer" className="footer__social-link">TikTok</a>
              <a href="https://www.facebook.com/profile.php?id=61589152890006" target="_blank" rel="noreferrer" className="footer__social-link">Facebook</a>
              <a href="https://wa.me/201055115993" target="_blank" rel="noreferrer" className="footer__social-link">WhatsApp</a>
            </div>
          </div>
          <div>
            <div className="footer__col-title">Shop</div>
            <Link to="/shop" className="footer__link">All Objects</Link>
            <Link to="/shop?cat=vases" className="footer__link">Vases & Planters</Link>
            <Link to="/shop?cat=desk" className="footer__link">Desk Objects</Link>
            <Link to="/gifting" className="footer__link">Gift Collections</Link>
            <Link to="/contact?subject=custom" className="footer__link">Custom Orders</Link>
          </div>
          <div>
            <div className="footer__col-title">Information</div>
            <Link to="/about" className="footer__link">About Cavero</Link>
            <Link to="/contact" className="footer__link">Contact Us</Link>
            <Link to="/contact" className="footer__link">FAQ</Link>
            <Link to="/contact" className="footer__link">Shipping & Returns</Link>
          </div>
          <div>
            <div className="footer__col-title">Cairo, Egypt</div>
            <a href="mailto:caveroegy@gmail.com" className="footer__link">caveroegy@gmail.com</a>
            <a href="https://wa.me/201055115993" target="_blank" rel="noreferrer" className="footer__link">WhatsApp</a>
            <p className="footer__link" style={{ cursor:'default' }}>Sun – Thu · 10am – 8pm</p>
            <div style={{ marginTop:24 }}><Link to="/contact?subject=custom" className="btn btn-outline-cream btn-sm">Custom order</Link></div>
          </div>
        </div>
        <div className="footer__bottom">
          <p className="footer__copy">© 2025 Cavero Studio · Cairo, Egypt · All rights reserved.</p>
          <div className="footer__social"><a href="#" className="footer__social-link">Privacy Policy</a><a href="#" className="footer__social-link">Terms</a></div>
        </div>
      </div>
    </footer>
  )
}