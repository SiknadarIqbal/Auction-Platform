import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Frontpage from "./pages/Frontpage/Frontpage";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import Dashboard from "./pages/Dashboard/Dashboard";

import { useNavigate } from "react-router-dom";
import Agreement from "./pages/Auth/Agreement";
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasAgreed, setHasAgreed] = React.useState(() => localStorage.getItem("hasAgreed") === "true");

  React.useEffect(() => {
    if (!hasAgreed && location.pathname !== "/agreement") {
      navigate("/agreement");
    }
  }, [hasAgreed, location.pathname, navigate]);

  // If not agreed and not on agreement page, render nothing to avoid flash
  if (!hasAgreed && location.pathname !== "/agreement") {
    return null;
  }

  const hiddenNavbarRoutes = ["/dashboard", "/agreement"];
  const shouldShowNavbar = !hiddenNavbarRoutes.includes(location.pathname) && hasAgreed;

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowNavbar && <Navbar />}
      <Routes>
        <Route path="/agreement" element={<Agreement onAccept={() => setHasAgreed(true)} />} />
        <Route path="/" element={<Frontpage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
      {shouldShowNavbar && hasAgreed && <Footer />}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}

export default App;
