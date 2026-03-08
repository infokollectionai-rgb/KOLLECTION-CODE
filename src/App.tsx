import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupWizard from "./pages/SignupWizard";
import ExecutiveDashboard from "./pages/dashboard/ExecutiveDashboard";
import AccountManagement from "./pages/dashboard/AccountManagement";
import ConversationsPanel from "./pages/dashboard/ConversationsPanel";
import InstallmentPlans from "./pages/dashboard/InstallmentPlans";
import PromiseTracker from "./pages/dashboard/PromiseTracker";
import AnalyticsDeep from "./pages/dashboard/AnalyticsDeep";
import HumanTakeover from "./pages/dashboard/HumanTakeover";
import BillingPage from "./pages/dashboard/BillingPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminClients from "./pages/admin/AdminClients";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminAIPerformance from "./pages/admin/AdminAIPerformance";
import AdminSettings from "./pages/admin/AdminSettings";

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
            <Route path="/dashboard" element={<ExecutiveDashboard />} />
            <Route path="/dashboard/accounts" element={<AccountManagement />} />
            <Route path="/dashboard/conversations" element={<ConversationsPanel />} />
            <Route path="/dashboard/installments" element={<InstallmentPlans />} />
            <Route path="/dashboard/promises" element={<PromiseTracker />} />
            <Route path="/dashboard/analytics" element={<AnalyticsDeep />} />
            <Route path="/dashboard/takeover" element={<HumanTakeover />} />
            <Route path="/dashboard/billing" element={<BillingPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/clients" element={<AdminClients />} />
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
