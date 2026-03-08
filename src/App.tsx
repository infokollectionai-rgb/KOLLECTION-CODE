import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import OnboardingWizard from "./pages/OnboardingWizard";
import ExecutiveDashboard from "./pages/dashboard/ExecutiveDashboard";
import AccountManagement from "./pages/dashboard/AccountManagement";
import ActivityLog from "./pages/dashboard/ActivityLog";
import InstallmentPlans from "./pages/dashboard/InstallmentPlans";
import Reports from "./pages/dashboard/Reports";
import BillingPage from "./pages/dashboard/BillingPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminClients from "./pages/admin/AdminClients";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminAIPerformance from "./pages/admin/AdminAIPerformance";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminApplications from "./pages/admin/AdminApplications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/dashboard" element={<ExecutiveDashboard />} />
            <Route path="/dashboard/accounts" element={<AccountManagement />} />
            <Route path="/dashboard/activity" element={<ActivityLog />} />
            <Route path="/dashboard/installments" element={<InstallmentPlans />} />
            <Route path="/dashboard/reports" element={<Reports />} />
            <Route path="/dashboard/billing" element={<BillingPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/revenue" element={<AdminRevenue />} />
            <Route path="/admin/ai-performance" element={<AdminAIPerformance />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
