import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { ToastContainer } from './components/common/ToastContainer';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { ComplainantDashboard } from './pages/ComplainantDashboard';
import { NewComplaintWizard } from './pages/NewComplaintWizard';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { AdminPage } from './pages/AdminPage';

export const AppContent: React.FC = () => {
  const { activePage } = useApp();

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <AuthPage />;
      case 'complainant-dashboard':
        return <ComplainantDashboard />;
      case 'new-complaint':
        return <NewComplaintWizard />;
      case 'complaint-detail':
        return <ComplaintDetailPage />;
      case 'officer-dashboard':
        return <OfficerDashboard />;
      case 'admin-dashboard':
        return <AdminPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Prominent Academic & Non-Legal FIR Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Navigation Bar */}
      <Navbar />

      {/* Dynamic Page Content */}
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {/* Global Toast Notification System */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;

