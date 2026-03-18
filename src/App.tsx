import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query" as any;
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
import AdminClientDetail from "./pages/admin/AdminClientDetail";
import AdminConversations from "./pages/admin/AdminConversations";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminSettings from "./pages/admin/AdminSettings";

import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Public auth routes — NO ProtectedRoute */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Onboarding — authenticated but not yet onboarded */}
      <Route path="/onboarding" element={<ProtectedRoute requireOnboarded={false}><OnboardingWizard /></ProtectedRoute>} />

      {/* Client dashboard — onboarded */}
      <Route path="/dashboard" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/import" element={<ProtectedRoute><ImportAccountsPage /></ProtectedRoute>} />
      <Route path="/dashboard/accounts" element={<ProtectedRoute><AccountManagement /></ProtectedRoute>} />
      <Route path="/dashboard/conversations" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
      <Route path="/dashboard/activity" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
      <Route path="/dashboard/installments" element={<ProtectedRoute><InstallmentPlans /></ProtectedRoute>} />
      <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/dashboard/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminOverview /></ProtectedRoute>} />
      <Route path="/admin/clients" element={<ProtectedRoute requireAdmin><AdminClients /></ProtectedRoute>} />
      <Route path="/admin/clients/:id" element={<ProtectedRoute requireAdmin><AdminClientDetail /></ProtectedRoute>} />
      <Route path="/admin/conversations" element={<ProtectedRoute requireAdmin><AdminConversations /></ProtectedRoute>} />
      <Route path="/admin/billing" element={<ProtectedRoute requireAdmin><AdminBilling /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />

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
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
