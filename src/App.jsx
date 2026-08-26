import React, { Suspense, lazy, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { VendorSyncProvider } from './context/VendorSyncContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { updatePageSEO } from './utils/seo';

// Global Overlays & Modals
import { LocationModal } from './components/LocationModal';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { ReviewModal } from './components/ReviewModal';
import { VendorSwitchModal } from './components/VendorSwitchModal';
import { VoiceSearchModal } from './components/VoiceSearchModal';
import { VoiceAssistanceModal } from './components/VoiceAssistanceModal';
import { VendorChatModal } from './components/VendorChatModal';
import { VendorSimulatorDrawer } from './components/VendorSimulatorDrawer';
import { NotificationToast } from './components/NotificationToast';
import { InstallPwaBanner } from './components/InstallPwaBanner';

// Route-Based Code Splitting & Dynamic Imports
const HomeView = lazy(() => import('./views/HomeView').then(m => ({ default: m.HomeView })));
const CategoriesView = lazy(() => import('./views/CategoriesView').then(m => ({ default: m.CategoriesView })));
const ProductListingView = lazy(() => import('./views/ProductListingView').then(m => ({ default: m.ProductListingView })));
const ProductDetailView = lazy(() => import('./views/ProductDetailView').then(m => ({ default: m.ProductDetailView })));
const NearbyVendorsView = lazy(() => import('./views/NearbyVendorsView').then(m => ({ default: m.NearbyVendorsView })));
const CartView = lazy(() => import('./views/CartView').then(m => ({ default: m.CartView })));
const CheckoutView = lazy(() => import('./views/CheckoutView').then(m => ({ default: m.CheckoutView })));
const PaymentView = lazy(() => import('./views/PaymentView').then(m => ({ default: m.PaymentView })));
const OrderConfirmationView = lazy(() => import('./views/OrderConfirmationView').then(m => ({ default: m.OrderConfirmationView })));
const OrderTrackingView = lazy(() => import('./views/OrderTrackingView').then(m => ({ default: m.OrderTrackingView })));
const MyOrdersView = lazy(() => import('./views/MyOrdersView').then(m => ({ default: m.MyOrdersView })));
const ProfileView = lazy(() => import('./views/ProfileView').then(m => ({ default: m.ProfileView })));
const MyReviewsView = lazy(() => import('./views/MyReviewsView').then(m => ({ default: m.MyReviewsView })));
const SavedAddressesSupportView = lazy(() => import('./views/SavedAddressesSupportView').then(m => ({ default: m.SavedAddressesSupportView })));
const WishlistView = lazy(() => import('./views/WishlistView').then(m => ({ default: m.WishlistView })));
const OffersView = lazy(() => import('./views/OffersView').then(m => ({ default: m.OffersView })));
const NotificationsView = lazy(() => import('./views/NotificationsView').then(m => ({ default: m.NotificationsView })));
const VoiceSearchView = lazy(() => import('./views/VoiceSearchView').then(m => ({ default: m.VoiceSearchView })));
const FilterSortView = lazy(() => import('./views/FilterSortView').then(m => ({ default: m.FilterSortView })));
const VendorChatView = lazy(() => import('./views/VendorChatView').then(m => ({ default: m.VendorChatView })));
const VendorPortalView = lazy(() => import('./views/VendorPortalView').then(m => ({ default: m.VendorPortalView })));
const UnauthorizedView = lazy(() => import('./views/UnauthorizedView').then(m => ({ default: m.UnauthorizedView })));
const LoginView = lazy(() => import('./views/LoginView').then(m => ({ default: m.LoginView })));

/**
 * Lightweight Loading Fallback for Suspense Code-Split Routes
 */
const ViewFallbackLoader = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#065f46'
  }}>
    <div style={{
      width: '44px',
      height: '44px',
      border: '3.5px solid #d1fae5',
      borderTopColor: '#059669',
      borderRadius: '50%',
      animation: 'vsPreloaderSpin 0.75s linear infinite',
      marginBottom: '16px'
    }} />
    <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#047857' }}>
      Loading fresh produce...
    </span>
    <style>{`@keyframes vsPreloaderSpin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const MainContent = () => {
  const { currentView, currentViewParams } = useApp();

  // Scroll to top and dynamically update page SEO metadata on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updatePageSEO(currentView, currentViewParams);
  }, [currentView, currentViewParams]);

  const renderView = () => {
    switch (currentView) {
      // 1. Public Unrestricted Routes
      case 'home':
      case 'landing':
        return <HomeView />;
      case 'categories':
        return <CategoriesView />;
      case 'nearby-vendors':
        return <NearbyVendorsView />;
      case 'product-listing':
        return <ProductListingView />;
      case 'product-detail':
        return <ProductDetailView />;
      case 'cart':
        return <CartView />;
      case 'offers':
        return <OffersView />;
      case 'voice-search':
        return <VoiceSearchView />;
      case 'filter-sort':
        return <FilterSortView />;
      case 'login':
        return <LoginView params={currentViewParams} />;
      case 'unauthorized':
        return <UnauthorizedView params={currentViewParams} />;

      // 2. Customer-Protected Routes (Requires role: 'customer')
      case 'checkout':
        return (
          <ProtectedRoute allowedRoles={['customer']} viewName="checkout" viewParams={currentViewParams}>
            <CheckoutView />
          </ProtectedRoute>
        );
      case 'payment':
        return (
          <ProtectedRoute allowedRoles={['customer']} viewName="payment" viewParams={currentViewParams}>
            <PaymentView />
          </ProtectedRoute>
        );
      case 'order-confirmation':
        return (
          <ProtectedRoute allowedRoles={['customer']} viewName="order-confirmation" viewParams={currentViewParams}>
            <OrderConfirmationView />
          </ProtectedRoute>
        );
      case 'order-tracking':
        return (
          <ProtectedRoute allowedRoles={['customer']} viewName="order-tracking" viewParams={currentViewParams}>
            <OrderTrackingView />
          </ProtectedRoute>
        );
      case 'my-orders':
        return (
          <ProtectedRoute allowedRoles={['customer']} viewName="my-orders" viewParams={currentViewParams}>
            <MyOrdersView />
          </ProtectedRoute>
        );
      case 'my-reviews':
        return (
          <ProtectedRoute allowedRoles={['customer']} viewName="my-reviews" viewParams={currentViewParams}>
            <MyReviewsView />
          </ProtectedRoute>
        );
      case 'saved-addresses-support':
        return (
          <ProtectedRoute allowedRoles={['customer']} viewName="saved-addresses-support" viewParams={currentViewParams}>
            <SavedAddressesSupportView />
          </ProtectedRoute>
        );
      case 'wishlist':
        return (
          <ProtectedRoute allowedRoles={['customer']} viewName="wishlist" viewParams={currentViewParams}>
            <WishlistView />
          </ProtectedRoute>
        );

      // 3. Vendor-Protected Routes (Requires role: 'vendor')
      case 'vendor-portal':
        return (
          <ProtectedRoute allowedRoles={['vendor']} viewName="vendor-portal" viewParams={currentViewParams}>
            <VendorPortalView />
          </ProtectedRoute>
        );
      case 'vendor-chat':
        return (
          <ProtectedRoute allowedRoles={['vendor', 'customer']} viewName="vendor-chat" viewParams={currentViewParams}>
            <VendorChatView />
          </ProtectedRoute>
        );

      // 4. Universal Protected Routes (Requires authenticated user with either role)
      case 'profile':
        return (
          <ProtectedRoute allowedRoles={['customer', 'vendor']} viewName="profile" viewParams={currentViewParams}>
            <ProfileView />
          </ProtectedRoute>
        );
      case 'notifications':
        return (
          <ProtectedRoute allowedRoles={['customer', 'vendor']} viewName="notifications" viewParams={currentViewParams}>
            <NotificationsView />
          </ProtectedRoute>
        );

      default:
        return <HomeView />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '60px' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <ErrorBoundary>
          <Suspense fallback={<ViewFallbackLoader />}>
            {renderView()}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <BottomNav />

      {/* Global Overlays & Modals */}
      <LocationModal />
      <AuthModal />
      <CartDrawer />
      <ReviewModal />
      <VendorSwitchModal />
      <VoiceSearchModal />
      <VoiceAssistanceModal />
      <VendorChatModal />
      <VendorSimulatorDrawer />
      <NotificationToast />
      <InstallPwaBanner />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <VendorSyncProvider>
          <MainContent />
        </VendorSyncProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
