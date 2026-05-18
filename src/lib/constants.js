export const FREE_SHIPPING_THRESHOLD = 1000
export const FLAT_SHIPPING_RATE = 80
export const PRODUCTION_DAYS = '5-7'

export const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Sharqia', 'Dakahlia', 'Beheira',
  'Monufia', 'Gharbia', 'Kafr el-Sheikh', 'Damietta', 'Port Said', 'Ismailia',
  'Suez', 'North Sinai', 'South Sinai', 'Matruh', 'Faiyum', 'Beni Suef',
  'Minya', 'Asyut', 'Sohag', 'Qena', 'Luxor', 'Aswan', 'Red Sea', 'New Valley',
]

export const ORDER_STATUS = {
  pending_payment: { label: 'Order Placed', color: '#A8956F' },
  paid: { label: 'Order Confirmed', color: '#2D2B34' },
  in_production: { label: 'In Production', color: '#A8956F' },
  ready_to_ship: { label: 'Ready to Ship', color: '#2D2B34' },
  shipped: { label: 'Shipped', color: '#2D2B34' },
  delivered: { label: 'Delivered', color: '#6B8F5E' },
  cancelled: { label: 'Cancelled', color: '#8B1A1A' },
}

// Cash on delivery only — add Paymob options here when ready
export const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on delivery', description: 'Pay in cash when your order arrives at your door.' },
]