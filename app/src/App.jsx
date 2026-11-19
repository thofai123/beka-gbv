import { useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import TermsGate from '@/components/TermsGate';
import ProfileSetupGate from '@/components/ProfileSetupGate';
import AdminRedirect from '@/components/AdminRedirect';
import PageTransition from '@/components/PageTransition';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

// Eagerly loaded
import Dashboard from './pages/Dashboard';
import PanicButton from './pages/PanicButton';
import AdminDashboard from './pages/AdminDashboard';

// Lazy-loaded
const ReportIncident   = lazy(() => import('./pages/ReportIncident'));
const CaseList         = lazy(() => import('./pages/CaseList'));
const CaseDetail       = lazy(() => import('./pages/CaseDetail'));
const Messages         = lazy(() => import('./pages/Messages'));
const Analytics        = lazy(() => import('./pages/Analytics'));
const Team             = lazy(() => import('./pages/Team'));
const SettingsPage     = lazy(() => import('./pages/SettingsPage'));
const Resources        = lazy(() => import('./pages/Resources'));
const EvidenceVault    = lazy(() => import('./pages/EvidenceVault'));
const StatementBuilder = lazy(() => import('./pages/StatementBuilder'));
const AlertsMap        = lazy(() => import('./pages/AlertsMap'));
const SecurityPage     = lazy(() => import('./pages/SecurityPage'));
const ResponseUnits    = lazy(() => import('./pages/ResponseUnits'));
const EmergencyContacts = lazy(() => import('./pages/EmergencyContacts'));
const LiveLocation     = lazy(() => import('./pages/LiveLocation'));

const RouteFallback = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const AdminApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, user, navigateToLogin, isAuthenticated } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Auth has finished loading. Only redirect once we're certain there's no authenticated user.
  if (!isAuthenticated || !user) {
    navigateToLogin();
    return null;
  }

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-lg font-semibold">Access Denied</p>
        <p className="text-sm text-muted-foreground">You need admin privileges to view this page.</p>
      </div>
    );
  }

  return (
    <Layout>
      <AdminDashboard user={user} />
    </Layout>
  );
};

const AUTH_ROUTE_PATHS = ['/beka/login', '/beka/register', '/beka/forgot-password', '/beka/reset-password'];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin, user } = useAuth();
  const location = useLocation();

  if (location.pathname === '/beka/live') {
    return (
      <Suspense fallback={<RouteFallback />}>
        <LiveLocation />
      </Suspense>
    );
  }

  // Public auth pages render standalone — never gated by Terms/ProfileSetup or the auth guard.
  if (AUTH_ROUTE_PATHS.includes(location.pathname)) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location}>
          <Route path="login"           element={<Login />} />
          <Route path="register"        element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password"  element={<ResetPassword />} />
        </Routes>
      </Suspense>
    );
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // After loading resolves: redirect unauthenticated users to login (auth pages already handled above)
  if (!isLoadingAuth && !isLoadingPublicSettings && !isAuthenticated && !authError) {
    navigateToLogin();
    return null;
  }

  return (
    <TermsGate>
      <ProfileSetupGate user={user}>
        <RoutedScreens location={location} user={user} />
      </ProfileSetupGate>
    </TermsGate>
  );
};

const RoutedScreens = ({ location }) => {
  const direction = useNavigationDirection();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname} direction={direction}>
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
            {/* Protected app routes */}
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/beka/login" replace />} />}>
              <Route element={<Layout />}>
                <Route path="/"               element={<Dashboard />} />
                <Route path="panic"          element={<AdminRedirect to="/beka/alerts-map" reason="Admins monitor alerts — they don't trigger them."><PanicButton /></AdminRedirect>} />
                <Route path="report"         element={<AdminRedirect><ReportIncident /></AdminRedirect>} />
                <Route path="cases"          element={<CaseList />} />
                <Route path="cases/:id"      element={<CaseDetail />} />
                <Route path="messages"       element={<Messages />} />
                <Route path="analytics"      element={<Analytics />} />
                <Route path="team"           element={<Team />} />
                <Route path="settings"       element={<SettingsPage />} />
                <Route path="resources"      element={<Resources />} />
                <Route path="evidence"       element={<AdminRedirect reason="The Evidence Vault is for survivors only."><EvidenceVault /></AdminRedirect>} />
                <Route path="statement"      element={<AdminRedirect reason="Statement Builder is for survivors only."><StatementBuilder /></AdminRedirect>} />
                <Route path="alerts-map"     element={<AlertsMap />} />
                <Route path="security"       element={<SecurityPage />} />
                <Route path="response-units" element={<ResponseUnits />} />
                <Route path="contacts"       element={<EmergencyContacts />} />
                <Route path="*"              element={<PageNotFound />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </PageTransition>
    </AnimatePresence>
  );
};

function App() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => document.documentElement.classList.toggle('dark', e.matches);
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const nav = performance.getEntriesByType?.('navigation')?.[0];
    const isFreshLoad = !nav || nav.type === 'navigate' || nav.type === 'reload';
    const path = window.location.pathname;
    const AUTH_PATHS = ['/beka/login', '/beka/register', '/beka/forgot-password', '/beka/reset-password'];
    if (isFreshLoad && path !== '/' && path !== '/admin' && path !== '/beka' && path !== '/beka/' &&
        !path.startsWith('/beka/live') && !AUTH_PATHS.includes(path)) {
      window.history.replaceState({}, '', '/beka/');
    }
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/beka/" replace />} />
              <Route path="/admin" element={<AdminApp />} />
              <Route path="/beka/*" element={<AuthenticatedApp />} />
              <Route path="/cases" element={<Navigate to="/beka/cases" replace />} />
              <Route path="/cases/:id" element={<Navigate to="/beka/cases" replace />} />
              <Route path="/alerts-map" element={<Navigate to="/beka/alerts-map" replace />} />
              <Route path="/team" element={<Navigate to="/beka/team" replace />} />
              <Route path="/analytics" element={<Navigate to="/beka/analytics" replace />} />
              <Route path="/response-units" element={<Navigate to="/beka/response-units" replace />} />
              <Route path="/security" element={<Navigate to="/beka/security" replace />} />
              <Route path="*" element={<Navigate to="/beka/" replace />} />
            </Routes>
            <Toaster />
          </Router>
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;