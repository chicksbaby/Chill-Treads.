import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Order, SiteSettings } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/initialData';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

export interface TrackedOrderMilestone {
  orderNumber: string;
  createdAt: string;
  status: string;
  carrierName: string;
  trackingNumber: string | null;
  supplierName: string;
  destinationCity: string;
  destinationState: string;
  customerMaskedName: string;
  customerMaskedPhone: string;
  items: Array<{
    name: string;
    size: string;
    color: string;
    quantity: number;
    image: string;
  }>;
}

export interface PlacedOrderReceipt {
  orderNumber: string;
  orderId: string;
  orderSecretKey?: string;
  createdAt: string;
  status: string;
  total: number;
  itemsCount: number;
  paymentMethod: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: Array<{
    name: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  subtotal: number;
  discount: number;
  shippingFee: number;
}

interface StoreContextType {
  // Navigation
  currentRoute: string;
  navigateTo: (route: string) => void;
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  resetProductsToDefault: () => void;
  // Settings
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  updateCartQuantity: (cartItemId: string, newQty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartCount: number;
  subtotal: number;
  shippingFee: number;
  discountCode: string;
  discountAmount: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  total: number;
  freeShippingProgress: number;
  amountNeededForFreeShipping: number;
  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  // Secure Order Workflow
  submitOrder: (orderPayload: {
    customerName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    paymentMethod: string;
  }) => Promise<{ success: boolean; order?: PlacedOrderReceipt; error?: string }>;
  lastPlacedOrder: PlacedOrderReceipt | null;
  clearLastPlacedOrder: () => void;
  trackOrder: (orderNumber: string, phoneVerification?: string) => Promise<{ success: boolean; data?: TrackedOrderMilestone; error?: string; requiresVerification?: boolean }>;
  // Admin Authentication & Secure Backend APIs
  isAdminAuthenticated: boolean;
  adminToken: string | null;
  adminLogin: (password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
  adminOrders: Order[];
  fetchAdminOrders: () => Promise<void>;
  updateAdminOrder: (orderId: string, updates: Partial<Order>) => Promise<{ success: boolean; error?: string }>;
  deleteAdminOrder: (orderId: string) => Promise<{ success: boolean; error?: string }>;
  resetAdminDemoData: () => Promise<{ success: boolean; error?: string }>;
  // Modals & Overlays
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isSizeGuideOpen: boolean;
  setIsSizeGuideOpen: (open: boolean) => void;
  activePolicy: string | null;
  setActivePolicy: (policyName: string | null) => void;
  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation sync with window.location.hash
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.hash || '#/';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      setCurrentRoute(hash);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
  };

  // State initialization with localStorage (for catalog & preferences only - NEVER customer orders!)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('chill_treads_products');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PRODUCTS;
  });

  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('chill_treads_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_SETTINGS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('chill_treads_cart');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('chill_treads_wishlist');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Client Session States (Clean memory only - No customer PII in localStorage!)
  const [lastPlacedOrder, setLastPlacedOrder] = useState<PlacedOrderReceipt | null>(null);
  const [discountCode, setDiscountCode] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Admin Authentication State (Stored in sessionStorage only, purged on window close)
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('chill_admin_token');
    } catch {
      return null;
    }
  });
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);

  // Persist Catalog and Preferences
  useEffect(() => {
    localStorage.setItem('chill_treads_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('chill_treads_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('chill_treads_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('chill_treads_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Clean up any legacy orders in browser storage from previous insecure versions
  useEffect(() => {
    try {
      if (localStorage.getItem('chill_treads_orders')) {
        localStorage.removeItem('chill_treads_orders');
      }
    } catch {
      // ignore
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Product actions
  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const id = newProd.slug || 'prod-' + Date.now();
    const created: Product = { ...newProd, id };
    setProducts((prev) => [created, ...prev]);
    showToast(`Added product "${created.name}"`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast('Product updated successfully');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Product removed');
  };

  const resetProductsToDefault = () => {
    setProducts(INITIAL_PRODUCTS);
    setSettings(INITIAL_SETTINGS);
    showToast('Reset store catalog to defaults');
  };

  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Site settings saved');
  };

  // Cart actions
  const addToCart = (product: Product, size: string, color: string, quantity = 1) => {
    const cartItemId = `${product.id}-${size}-${color}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          price: product.price,
          size,
          color,
          image: product.image,
          quantity,
        },
      ];
    });
    showToast(`Added ${product.name} (${size}) to Bag`, 'success');
  };

  const updateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item))
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    showToast('Item removed from Bag', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setDiscountCode('');
  };

  // Cart Calculations
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Discount calculation
  let discountAmount = 0;
  if (discountCode.toUpperCase() === 'CHILL10') {
    discountAmount = Math.round(subtotal * 0.1);
  } else if (discountCode.toUpperCase() === 'FREESHIP') {
    discountAmount = 0;
  }

  const isFreeShippingViaCode = discountCode.toUpperCase() === 'FREESHIP';
  const qualifiesForFreeShipping = subtotal >= settings.freeShippingThreshold || isFreeShippingViaCode;
  const shippingFee = cart.length === 0 || qualifiesForFreeShipping ? 0 : settings.shippingFee;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const amountNeededForFreeShipping = Math.max(0, settings.freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / settings.freeShippingThreshold) * 100)
  );

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'CHILL10') {
      setDiscountCode('CHILL10');
      showToast('Promo code CHILL10 applied: 10% OFF!');
      return { success: true, message: '10% discount applied!' };
    }
    if (clean === 'FREESHIP') {
      setDiscountCode('FREESHIP');
      showToast('Promo code FREESHIP applied: Free Delivery!');
      return { success: true, message: 'Free shipping unlocked!' };
    }
    return { success: false, message: 'Invalid code. Try CHILL10 for 10% off.' };
  };

  const removeCoupon = () => {
    setDiscountCode('');
    showToast('Coupon removed', 'info');
  };

  // Wishlist actions
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast('Removed from wishlist', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Added to wishlist', 'success');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Secure Order Submission to Server API (Validates on backend, recomputes prices, protects customer PII)
  const submitOrder = async (orderPayload: {
    customerName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    paymentMethod: string;
  }) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...orderPayload,
          discountCode,
          items: cart.map((item) => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            image: item.image,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to place order on server' };
      }

      const receipt: PlacedOrderReceipt = {
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        orderSecretKey: data.orderSecretKey,
        createdAt: data.createdAt,
        status: data.status,
        total: data.total,
        itemsCount: data.itemsCount,
        paymentMethod: data.paymentMethod,
        customerName: orderPayload.customerName,
        phone: orderPayload.phone,
        address: orderPayload.address,
        city: orderPayload.city,
        state: orderPayload.state,
        pincode: orderPayload.pincode,
        items: cart.map((c) => ({
          name: c.name,
          size: c.size,
          color: c.color,
          quantity: c.quantity,
          price: c.price,
          image: c.image,
        })),
        subtotal,
        discount: discountAmount,
        shippingFee,
      };

      setLastPlacedOrder(receipt);
      clearCart();
      return { success: true, order: receipt };
    } catch {
      return { success: false, error: 'Network error communicating with order server.' };
    }
  };

  const clearLastPlacedOrder = () => setLastPlacedOrder(null);

  // Public Order Tracking with Customer Verification & Privacy Masking
  const trackOrder = async (orderNumber: string, phoneVerification?: string) => {
    try {
      let url = `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}`;
      if (phoneVerification) {
        url += `&phone=${encodeURIComponent(phoneVerification.trim())}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Order not found',
          requiresVerification: !!data.requiresVerification,
        };
      }
      return { success: true, data: data as TrackedOrderMilestone };
    } catch {
      return { success: false, error: 'Failed to connect to tracking server' };
    }
  };

  // Admin Authentication & Operations
  const adminLogin = async (password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid admin credentials' };
      }
      setAdminToken(data.token);
      sessionStorage.setItem('chill_admin_token', data.token);
      showToast('Authenticated as Store Administrator', 'success');
      return { success: true };
    } catch {
      return { success: false, error: 'Authentication service unavailable' };
    }
  };

  const adminLogout = async () => {
    if (adminToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } catch {
        // quiet
      }
    }
    setAdminToken(null);
    sessionStorage.removeItem('chill_admin_token');
    setAdminOrders([]);
    showToast('Admin session ended and token revoked', 'info');
  };

  const fetchAdminOrders = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/orders', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.status === 401 || res.status === 403) {
        adminLogout();
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setAdminOrders(data);
      }
    } catch {
      // quiet fail
    }
  };

  const updateAdminOrder = async (orderId: string, updates: Partial<Order>) => {
    if (!adminToken) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Update failed' };
      }
      await fetchAdminOrders();
      showToast('Order fulfillment record saved');
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to update order' };
    }
  };

  const deleteAdminOrder = async (orderId: string) => {
    if (!adminToken) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Deletion failed' };
      }
      await fetchAdminOrders();
      showToast('Order removed from database');
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to delete order' };
    }
  };

  const resetAdminDemoData = async () => {
    if (!adminToken) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch('/api/admin/reset-demo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Reset failed' };
      }
      await fetchAdminOrders();
      showToast('Demo data reset to clean baseline');
      return { success: true };
    } catch {
      return { success: false, error: 'Reset failed' };
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentRoute,
        navigateTo,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        resetProductsToDefault,
        settings,
        updateSettings,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartCount,
        subtotal,
        shippingFee,
        discountCode,
        discountAmount,
        applyCoupon,
        removeCoupon,
        total,
        freeShippingProgress,
        amountNeededForFreeShipping,
        wishlist,
        toggleWishlist,
        isInWishlist,
        submitOrder,
        lastPlacedOrder,
        clearLastPlacedOrder,
        trackOrder,
        isAdminAuthenticated: !!adminToken,
        adminToken,
        adminLogin,
        adminLogout,
        adminOrders,
        fetchAdminOrders,
        updateAdminOrder,
        deleteAdminOrder,
        resetAdminDemoData,
        isSearchOpen,
        setIsSearchOpen,
        isSizeGuideOpen,
        setIsSizeGuideOpen,
        activePolicy,
        setActivePolicy,
        toasts,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
