// This is the main App component. It will contain the routes of the websites
import { useState } from 'react'; // Add this import
import { Navigate, Routes, Route } from "react-router-dom";
import ApiTester from './assets/components/apitester'
import HomePage from "./pages/home-page";
import AboutPage from "./pages/about-page";
import ContactPage from "./pages/contact-page";
import ResultsPage from "./pages/results-page";
import HelpCenterPage from "./pages/help-center-page";
import TermsPage from "./pages/terms-page";
import PrivacyPage from "./pages/privacy-page";
import LandingPage from "./pages/landing-page";
import SettingsPage from "./pages/settings-page";
import LoginPage from "./pages/login-page";
import SignUpPage from "./pages/sign-up-page";
import ApiDocsPage from "./pages/api-docs-page";
import HistoryPage from "./pages/history-page";
import defaultIcon from "./assets/images/logo.png";

const PrivateRoute = ({ children }) => {
  return localStorage.getItem("authToken") ? children : <Navigate to="/login" />;
};

function App() {
  const [icon, setIcon] = useState(defaultIcon); // Fixed typo: 'sectIcon' to 'setIcon'

  return (
    <>   
      {/* Favicon links - React 19 automatically hoists these to <head> */}
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      {/* Optional: Use dynamic icon from your logo if needed */}
      <link rel="icon" type="image/png" href={icon} />
      
      <Routes>
        <Route path="/apitester" element={<ApiTester/>} />
        <Route path="/results" element={<ResultsPage/>} />
        <Route path="/api-tester" element={<ApiTester />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contacts" element={<ContactPage />} />
        <Route path="/help-center" element={<HelpCenterPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/api-docs" element={<ApiDocsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/landing" element={
          <PrivateRoute>
            <LandingPage />
          </PrivateRoute>
        } />
      </Routes>
    </>
  );
}

export default App;