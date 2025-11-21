import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { AuthForm } from "@/components/AuthForm";
import { ClientDashboard } from "@/components/ClientDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { SuperAdminDashboard } from "@/components/SuperAdminDashboard";
import { BrokerDashboard } from "@/components/BrokerDashboard";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "@/pages/Index";
import OAuthCallback from "@/pages/OAuthCallback";

const queryClient = new QueryClient();

type AppState = 'splash' | 'auth' | 'dashboard';

const AppContent = () => {
  const { user, isLoading, hasRole } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for at least 2 seconds
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasRole('admin');
  const isBroker = hasRole('broker');

  const getDashboard = () => {
    if (isSuperAdmin) return <SuperAdminDashboard />;
    if (isAdmin) return <AdminDashboard />;
    if (isBroker) return <BrokerDashboard />;
    return <ClientDashboard />;
  };

  return (
    <Routes>
      <Route path="/" element={user ? getDashboard() : <Navigate to="/welcome" replace />} />
      <Route path="/welcome" element={user ? <Navigate to="/" replace /> : <Index />} />
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthForm onBack={() => window.history.back()} />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
