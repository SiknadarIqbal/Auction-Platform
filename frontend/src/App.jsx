import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Frontpage from "./pages/Frontpage/Frontpage";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import Dashboard from "./pages/Dashboard/Dashboard";

import Agreement from "./pages/Auth/Agreement";
import ProtectedRoute from "./Components/ProtectedRoute";

function AgreementGate({ children }) {
  const location = useLocation();
  const hasAgreed = localStorage.getItem("hasAgreed") === "true";

  if (!hasAgreed) {
    return <Navigate to="/agreement" state={{ from: location }} replace />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const hiddenNavbarRoutes = ["/dashboard", "/agreement"];
  const shouldShowNavbar = !hiddenNavbarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowNavbar && <Navbar />}
      <Routes>
        <Route path="/agreement" element={<Agreement />} />
        <Route path="/" element={<Frontpage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/login" element={
          <AgreementGate>
            <Login />
          </AgreementGate>
        } />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
      {shouldShowNavbar && <Footer />}
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
