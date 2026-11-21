import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth
import { AuthPage } from '../pages/auth/AuthPage';

// Customer Pages (Screens 1-8)
import { ProductCatalogPage } from '../pages/customer/ProductCatalogPage';
import { ProductDetailsPage } from '../pages/customer/ProductDetailsPage';
import { ShoppingCartPage } from '../pages/customer/ShoppingCartPage';
import { CheckoutPage } from '../pages/customer/CheckoutPage';
import { PaymentResultPage } from '../pages/customer/PaymentResultPage';
import { MyOrdersPage } from '../pages/customer/MyOrdersPage';
import { OrderDetailsPage } from '../pages/customer/OrderDetailsPage';

// Admin Pages (Screens 9-18)
import { DashboardOverviewPage } from '../pages/admin/DashboardOverviewPage';
import { ProductListPage } from '../pages/admin/ProductListPage';
import { ProductFormPage } from '../pages/admin/ProductFormPage';
import { InventoryPage } from '../pages/admin/InventoryPage';
import { StockMovementPage } from '../pages/admin/StockMovementPage';
import { OrderListPage } from '../pages/admin/OrderListPage';
import { OrderDetailsSagaPage } from '../pages/admin/OrderDetailsSagaPage';
import { PaymentLedgerPage } from '../pages/admin/PaymentLedgerPage';
import { EventMonitorPage } from '../pages/admin/EventMonitorPage';
import { DlqRetryPage } from '../pages/admin/DlqRetryPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
        </Route>

        {/* Customer Portal Routes (8 Màn) */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductCatalogPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<ShoppingCartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-result/:orderId" element={<PaymentResultPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
        </Route>

        {/* Admin Dashboard Routes (10 Màn) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/history" element={<StockMovementPage />} />
          <Route path="orders" element={<OrderListPage />} />
          <Route path="orders/:id" element={<OrderDetailsSagaPage />} />
          <Route path="payments" element={<PaymentLedgerPage />} />
          <Route path="system/events" element={<EventMonitorPage />} />
          <Route path="system/dlq" element={<DlqRetryPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
