import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { CartProvider } from '@/context/CartContext'
import { AdminProvider } from '@/context/AdminContext'
import AdminGuard from '@/components/AdminGuard'
import Nav from '@/components/Nav'
import Home from '@/pages/Home'
import Shop from '@/pages/Shop'
import Product from '@/pages/Product'
import Gifting from '@/pages/Gifting'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import OrderConfirmation from '@/pages/OrderConfirmation'
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
      <AdminGuard>
        <Routes>
          <Route path="/admin"              element={<AdminDashboard />} />
          <Route path="/admin/orders"       element={<AdminOrders />} />
          <Route path="/admin/orders/:id"   element={<AdminOrderDetail />} />
          <Route path="/admin/products"     element={<AdminProducts />} />
          <Route path="/admin/products/:id" element={<AdminProductForm />} />
        </Routes>
      </AdminGuard>
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
