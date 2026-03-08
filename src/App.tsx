import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ReactNode } from "react";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingWizard from "./pages/OnboardingWizard";
import ExecutiveDashboard from "./pages/dashboard/ExecutiveDashboard";
import ImportAccountsPage from "./pages/dashboard/ImportAccountsPage";
import AccountManagement from "./pages/dashboard/AccountManagement";
import ConversationsPage from "./pages/dashboard/ConversationsPage";
import ActivityLog from "./pages/dashboard/ActivityLog";
import InstallmentPlans from "./pages/dashboard/InstallmentPlans";
import Reports from "./pages/dashboard/Reports";
import BillingPage from "./pages/dashboard/BillingPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminClients from "./pages/admin/AdminClients";
import AdminConversations from "./pages/admin/AdminConversations";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

function ProtectedRoute({ children, role }: { children: ReactNode; role?: 'admin' | 'user' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingWizard />} />

      {/* User Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute role="user"><ExecutiveDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/import" element={<ProtectedRoute role="user"><ImportAccountsPage /></ProtectedRoute>} />
      <Route path="/dashboard/accounts" element={<ProtectedRoute role="user"><AccountManagement /></ProtectedRoute>} />
      <Route path="/dashboard/conversations" element={<ProtectedRoute role="user"><ConversationsPage /></ProtectedRoute>} />
      <Route path="/dashboard/activity" element={<ProtectedRoute role="user"><ActivityLog /></ProtectedRoute>} />
      <Route path="/dashboard/installments" element={<ProtectedRoute role="user"><InstallmentPlans /></ProtectedRoute>} />
      <Route path="/dashboard/reports" element={<ProtectedRoute role="user"><Reports /></ProtectedRoute>} />
      <Route path="/dashboard/billing" element={<ProtectedRoute role="user"><BillingPage /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute role="user"><SettingsPage /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminOverview /></ProtectedRoute>} />
      <Route path="/admin/clients" element={<ProtectedRoute role="admin"><AdminClients /></ProtectedRoute>} />
      <Route path="/admin/conversations" element={<ProtectedRoute role="admin"><AdminConversations /></ProtectedRoute>} />
      <Route path="/admin/applications" element={<ProtectedRoute role="admin"><AdminApplications /></ProtectedRoute>} />
      <Route path="/admin/revenue" element={<ProtectedRoute role="admin"><AdminRevenue /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
