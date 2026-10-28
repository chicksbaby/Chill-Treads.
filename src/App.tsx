import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryCards } from './components/CategoryCards';
import { NewArrivals } from './components/NewArrivals';
import { BenefitsStrip } from './components/BenefitsStrip';
import { FeaturedProducts } from './components/FeaturedProducts';
import { BrandStoryBanner } from './components/BrandStoryBanner';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { PolicyModal } from './components/PolicyModal';
import { ToastContainer } from './components/ToastContainer';
import { ProductDetailPage } from './components/ProductDetailPage';
import { ShopPage } from './components/ShopPage';
import { CheckoutPage } from './components/CheckoutPage';
import { OrderTrackingPage } from './components/OrderTrackingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { WishlistPage } from './components/WishlistPage';
import { AboutPage } from './components/AboutPage';

const AppContent: React.FC = () => {
  const { currentRoute } = useStore();

  const renderCurrentView = () => {
    // Normalizing route
    const route = currentRoute.split('?')[0] || '#/';

    if (route === '#/' || route === '') {
      return (
        <main id="main-content">
          <HeroBanner />
          <CategoryCards />
          <NewArrivals />
          <BenefitsStrip />
          <FeaturedProducts />
          <BrandStoryBanner />
        </main>
      );
    }

    if (route === '#/shop') {
      return <ShopPage initialCategory="all" />;
    }

    if (route === '#/c/men') {
      return <ShopPage initialCategory="men" />;
    }

    if (route === '#/c/women') {
      return <ShopPage initialCategory="women" />;
    }

    if (route === '#/c/all') {
      return <ShopPage initialCategory="all" />;
    }

    if (route === '#/c/collections') {
      return <ShopPage initialCategory="collections" />;
    }

    if (route.startsWith('#/p/')) {
      const slug = route.replace('#/p/', '');
      return <ProductDetailPage slug={slug} />;
    }

    if (route === '#/checkout') {
      return <CheckoutPage />;
    }

    if (route === '#/track-order') {
      return <OrderTrackingPage />;
    }

    if (route === '#/admin') {
      return <AdminDashboard />;
    }

    if (route === '#/wishlist') {
      return <WishlistPage />;
    }

    if (route === '#/about' || route === '#/contact') {
      return <AboutPage />;
    }

    // Default fallback to homepage
    return (
      <main id="main-content">
        <HeroBanner />
        <CategoryCards />
        <NewArrivals />
        <BenefitsStrip />
        <FeaturedProducts />
        <BrandStoryBanner />
      </main>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-[#f4f4f4] antialiased selection:bg-white selection:text-black">
      {/* Top Announcement Bar */}
      <AnnouncementBar />

      {/* Streetwear Header */}
      <Header />

      {/* Main Dynamic View */}
      <div className="flex-1">
        {renderCurrentView()}
      </div>

      {/* Global Brand Footer */}
      <Footer />

      {/* Overlays & Drawers */}
      <CartDrawer />
      <SearchModal />
      <SizeGuideModal />
      <PolicyModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
