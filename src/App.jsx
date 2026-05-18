import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { CartProvider } from '@/context/CartContext'
import { AdminProvider } from '@/context/AdminContext'
import AdminGuard from '@/components/AdminGuard'
import Nav from '@/components/Nav'

// Store pages
import Home from '@/pages/Home'
import Shop from '@/pages/Shop'
import Product from '@/pages/Product'
import Gifting from '@/pages/Gifting'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import OrderConfirmation from '@/pages/OrderConfirmation'

// Admin pages
import AdminLogin from '@/pages/admin/Login'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminOrders from '@/pages/admin/Orders'
import AdminOrderDetail from '@/pages/admin/OrderDetail'
import AdminProducts from '@/pages/admin/Products'
import AdminProductForm from '@/pages/admin/ProductForm'

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
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:slug" element={<Product />} />
        <Route path="/gifting" element={<Gifting />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
      </Routes>
    </>
  )
}

function AdminLayout() {
  return (
    <AdminProvider>
      <Routes>
        {/* Login — no guard */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* All other admin routes — guarded */}
        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
        <Route path="/admin/orders/:id" element={<AdminGuard><AdminOrderDetail /></AdminGuard>} />
        <Route path="/admin/products" element={<AdminGuard><AdminProducts /></AdminGuard>} />
        <Route path="/admin/products/:id" element={<AdminGuard><AdminProductForm /></AdminGuard>} />
      </Routes>
    </AdminProvider>
  )
}

export default function App() {
  const { pathname } = useLocation()
  return (
    <CartProvider>
      <ScrollToTop />
      {pathname.startsWith('/admin') ? <AdminLayout /> : <StoreLayout />}
    </CartProvider>
  )
}