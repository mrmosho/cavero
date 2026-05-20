import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CartProvider } from '@/context/CartContext'
import { AdminProvider } from '@/context/AdminContext'
import AdminGuard from '@/components/AdminGuard'
import Nav from '@/components/Nav'

// Store pages
import Home              from '@/pages/Home'
import Shop              from '@/pages/Shop'
import Product           from '@/pages/Product'
import Gifting           from '@/pages/Gifting'
import About             from '@/pages/About'
import Contact           from '@/pages/Contact'
import Cart              from '@/pages/Cart'
import Checkout          from '@/pages/Checkout'
import OrderConfirmation from '@/pages/OrderConfirmation'

// Admin pages
import AdminLogin        from '@/pages/admin/Login'
import AdminDashboard    from '@/pages/admin/Dashboard'
import AdminOrders       from '@/pages/admin/Orders'
import AdminOrderDetail  from '@/pages/admin/OrderDetail'
import AdminProducts     from '@/pages/admin/Products'
import AdminProductForm    from '@/pages/admin/ProductForm'
import AdminSetPassword    from '@/pages/admin/SetPassword'
import AdminDiscountCodes  from '@/pages/admin/DiscountCodes'
import AdminFinance         from '@/pages/admin/Finance'
import AdminContacts        from '@/pages/admin/Contacts'
import AdminBlockList       from '@/pages/admin/BlockList'
import AdminCategories      from '@/pages/admin/Categories'

/**
 * Catches Supabase auth tokens in the URL hash.
 * Invite links land here: /#access_token=xxx&type=invite
 * We let Supabase process the token, then redirect to set-password page.
 */
function AuthCallbackHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash || !hash.includes('access_token')) return

    // Parse the hash fragment
    const params = new URLSearchParams(hash.replace('#', ''))
    const type   = params.get('type')

    // Let Supabase pick up the session from the URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (type === 'invite' || type === 'recovery') {
          // Send to password setup page
          navigate('/admin/set-password', { replace: true })
        } else {
          navigate('/admin', { replace: true })
        }
      }
    })
  }, [navigate])

  return null
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [pathname])
  return null
}

function StoreLayout() {
  const { pathname } = useLocation()
  return (
    <>
      <Nav dark={pathname === '/'} />
      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/shop"               element={<Shop />} />
        <Route path="/shop/:slug"         element={<Product />} />
        <Route path="/gifting"            element={<Gifting />} />
        <Route path="/about"              element={<About />} />
        <Route path="/contact"            element={<Contact />} />
        <Route path="/cart"               element={<Cart />} />
        <Route path="/checkout"           element={<Checkout />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
      </Routes>
    </>
  )
}

function AdminLayout() {
  return (
    <AdminProvider>
      <Routes>
        <Route path="/admin/login"        element={<AdminLogin />} />
        <Route path="/admin/set-password" element={<AdminSetPassword />} />
        <Route path="/admin"              element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/orders"       element={<AdminGuard><AdminOrders /></AdminGuard>} />
        <Route path="/admin/orders/:id"   element={<AdminGuard><AdminOrderDetail /></AdminGuard>} />
        <Route path="/admin/products"     element={<AdminGuard><AdminProducts /></AdminGuard>} />
        <Route path="/admin/products/:id"      element={<AdminGuard><AdminProductForm /></AdminGuard>} />
        <Route path="/admin/discount-codes"    element={<AdminGuard><AdminDiscountCodes /></AdminGuard>} />
        <Route path="/admin/finance"            element={<AdminGuard><AdminFinance /></AdminGuard>} />
        <Route path="/admin/contacts"           element={<AdminGuard><AdminContacts /></AdminGuard>} />
        <Route path="/admin/blocklist"          element={<AdminGuard><AdminBlockList /></AdminGuard>} />
        <Route path="/admin/categories"         element={<AdminGuard><AdminCategories /></AdminGuard>} />
      </Routes>
    </AdminProvider>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <CartProvider>
      <AuthCallbackHandler />
      <ScrollToTop />
      {isAdmin ? <AdminLayout /> : <StoreLayout />}
    </CartProvider>
  )
}