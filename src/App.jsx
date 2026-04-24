import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { CartProvider } from '@/context/CartContext'
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

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  const isDarkNav = pathname === '/'

  return (
    <CartProvider>
      <ScrollToTop />
      <Nav dark={isDarkNav} />
      <Routes>
        <Route path="/"                    element={<Home />} />
        <Route path="/shop"                element={<Shop />} />
        <Route path="/shop/:slug"          element={<Product />} />
        <Route path="/gifting"             element={<Gifting />} />
        <Route path="/about"               element={<About />} />
        <Route path="/contact"             element={<Contact />} />
        <Route path="/cart"                element={<Cart />} />
        <Route path="/checkout"            element={<Checkout />} />
        <Route path="/order-confirmation"  element={<OrderConfirmation />} />
      </Routes>
    </CartProvider>
  )
}
