export type Category = 'men' | 'women' | 'all' | 'collections';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: 'men' | 'women' | 'all';
  price: number;
  originalPrice?: number;
  colors: ProductColor[];
  defaultColor: string;
  sizes: string[];
  image: string;
  secondaryImage?: string;
  description: string;
  details: string[];
  fabricGsm: number;
  fit: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  supplierCost?: number;
}

export interface CartItem {
  id: string; // product id + size + color
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string;
}

export type OrderStatus = 'pending' | 'supplier_ordered' | 'dispatched' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'cod' | 'upi_demo' | 'card_demo';
  status: OrderStatus;
  // Dropshipping manual fulfilment fields
  supplierName?: string;
  supplierOrderId?: string;
  carrierName?: string;
  trackingNumber?: string;
  supplierCostTotal?: number;
  notes?: string;
}

export interface SiteSettings {
  announcementText: string;
  freeShippingThreshold: number;
  shippingFee: number;
  contactEmail: string;
  contactPhone: string;
  instagramUrl: string;
  brandTagline: string;
}
