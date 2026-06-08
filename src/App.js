import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PageTransition from "./components/PageTransition";
import PageLoader from "./components/PageLoader";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Books from "./pages/Books";
import Music from "./pages/Music";
import ItemDetail from "./pages/ItemDetail";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import LiveNotifications from "./components/LiveNotifications";
import { LanguageProvider } from "./context/LanguageContext";

const Recommendations = lazy(() => import("./pages/Recommendations"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/* ── Top navigation progress bar ── */
function NavigationProgress() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 500);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={location.pathname}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)",
            backgroundSize: "200% 100%",
            transformOrigin: "left",
            zIndex: 9999,
            borderRadius: "0 2px 2px 0",
            boxShadow: "0 0 12px rgba(59, 130, 246, 0.5)",
            animation: "navBarShimmer 1.5s ease-in-out infinite",
          }}
        />
      )}
    </AnimatePresence>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/item/:id" element={<PageTransition><ItemDetail /></PageTransition>} />
          <Route path="/books" element={<PageTransition><Books /></PageTransition>} />
          <Route path="/music" element={<PageTransition><Music /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/recommend" element={<PageTransition><Recommendations /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="/user/:id" element={<PageTransition><PublicProfile /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminLayout /></PageTransition>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="reviews" element={<AdminReviews />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <BrowserRouter>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <NavigationProgress />
            <Navbar />
            <main style={{ flex: 1 }}>
              <AppRoutes />
            </main>
            <Footer />

            <LiveNotifications />
          </div>
        </BrowserRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
