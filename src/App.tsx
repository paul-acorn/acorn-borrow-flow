import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { AuthForm } from "@/components/AuthForm";
import { Dashboard } from "@/components/Dashboard";

const queryClient = new QueryClient();

type AppState = 'splash' | 'auth' | 'dashboard';

const App = () => {
  const [appState, setAppState] = useState<AppState>('splash');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <>
                {appState === 'splash' && (
                  <SplashScreen onComplete={() => setAppState('auth')} />
                )}
                {appState === 'auth' && (
                  <AuthForm 
                    onLogin={() => setAppState('dashboard')}
                    onBack={() => setAppState('splash')}
                  />
                )}
                {appState === 'dashboard' && <Dashboard />}
              </>
            } />
            {/* Add future authenticated routes here */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                  <h1 className="text-2xl font-semibold text-navy">Page Not Found</h1>
                  <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
                </div>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
