import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { LocationsPage } from "./pages/locations";
import { BillboardsPage } from "./pages/billboards";
import { LandlordsPage } from "./pages/landlords";
import { CustomersPage } from "./pages/customers";
import { TaxesPage } from "./pages/taxes";
import { BookingsPage } from "./pages/bookings";

// Layout
import MainLayout from "./components/layout/MainLayout";

// Auth guard
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Master Data */}
            <Route path="billboards" element={<BillboardsPage />} />
            <Route path="regions" element={<LocationsPage />} />
            <Route path="landlords" element={<LandlordsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="taxes" element={<TaxesPage />} />

            {/* Operations */}
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="campaigns" element={<PlaceholderPage title="Campaigns" />} />
            <Route path="purchase-orders" element={<PlaceholderPage title="Purchase Orders" />} />
            <Route path="invoices" element={<PlaceholderPage title="Invoices" />} />
            <Route path="audit-media" element={<PlaceholderPage title="Audit Media" />} />

            {/* Reports & Settings */}
            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />

            {/* User Management */}
            <Route path="users" element={<PlaceholderPage title="Users" />} />
            <Route path="roles" element={<PlaceholderPage title="Roles" />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

// Placeholder component for pages not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-muted-foreground">This page is under development</p>
      </div>
    </div>
  );
}

export default App;
