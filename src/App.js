import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useEffect } from "react";
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
import AIChat from "./components/AIChat";
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
            <Navbar />
            <main style={{ flex: 1 }}>
              <AppRoutes />
            </main>
            <Footer />
            <AIChat />
            <LiveNotifications />
          </div>
        </BrowserRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
