import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "./components/layout/Navbar";
import { HomePage } from "./pages/HomePage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { NotebookPage } from "./pages/NotebookPage";
import { PostPage } from "./pages/PostPage";
import { ConfigurationError } from "./components/errors/ConfigurationError";
import { useAuthStore } from "./stores/authStore";
import { useAppStore } from "./stores/appStore";
import { validateConfiguration } from "./config/firecat";

// Initialize i18n
import "./i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/discover" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const initializeTheme = useAppStore((s) => s.initializeTheme);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <div className="min-h-screen bg-theme-bg-primary">
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/notebook/:notebookPubkey" element={<NotebookPage />} />
        <Route
          path="/notebook/:notebookPubkey/post/:postPubkey"
          element={<PostPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  // Validate configuration on app boot
  const configValidation = validateConfiguration();

  if (!configValidation.valid) {
    return <ConfigurationError error={configValidation.error || "Unknown error"} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
