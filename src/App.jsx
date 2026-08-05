import React from 'react'
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import SplashScreen from '@/components/SplashScreen'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import DriverSignupFlow from './pages/DriverSignupFlow';
import RiderSignupFlow from './pages/RiderSignupFlow';
import JoinUs from './pages/JoinUs';
import JoinPage from './pages/Join';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import CommunityForum from './pages/CommunityForum';
import CommunityInstagram from './pages/CommunityInstagram';
import CommunityRecommendations from './pages/CommunityRecommendations';
import CommunityHowToVisit from './pages/CommunityHowToVisit';
import CommunityJobs from './pages/CommunityJobs';
import { base44 } from '@/api/base44Client';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from './pages/Home';
import ContactUs from './pages/ContactUs';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import BookingSuccess from './pages/BookingSuccess';
import SmsOptIn from './pages/SmsOptIn';
import OpioSignup from './pages/OpioSignup';
import KupunaSignup from './pages/KupunaSignup';
import DriverVerificationChart from './pages/DriverVerificationChart';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  // Check auth status on mount to determine landing page
  React.useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check on success page — just render it immediately
      if (window.location.pathname === '/bookingsuccess') {
        setIsCheckingAuth(false);
        return;
      }
      try {
        const user = await base44.auth.me();
        // User is authenticated
        // user_type may be undefined for users who signed up via the platform's
        // built-in signup (it doesn't set custom entity fields like user_type),
        // so also treat onboarding as done for admins or anyone who already
        // finished the profile quiz — otherwise they get stuck in a /join loop.
        const needsOnboarding = user.role !== 'admin'
          && !user.has_completed_profile_quiz
          && (!user.user_type || user.user_type === 'new');

        if (window.location.pathname === '/' && needsOnboarding) {
          window.location.replace('/join');
          return;
        }

        // Catch users who landed on any authenticated page without completing onboarding
        // (e.g., signed up through the platform login's "Sign up" link, which redirects
        // to /trips and bypasses the Join wizard)
        const onboardingOrPublicPaths = [
          '/join', '/account', '/welcome', '/joinus',
          '/driversignupflow', '/ridersignupflow',
          '/opiosignup', '/kupunasignup',
          '/termsofservice', '/privacypolicy', '/sms-opt-in',
          '/aboutus', '/about-us', '/contactus', '/contact-us',
          '/driver-verification', '/unsubscrib'
        ];
        const currentPath = window.location.pathname.toLowerCase();
        const isOnboardingOrPublic = onboardingOrPublicPaths.some(
          p => currentPath === p || currentPath.startsWith(p)
        );

        if (needsOnboarding && !isOnboardingOrPublic) {
          window.location.replace('/join');
        }
      } catch (e) {
        // Not authenticated - stay on current page
      }
      setIsCheckingAuth(false);
    };
    
    if (!isLoadingAuth && !isLoadingPublicSettings) {
      checkAuth();
    }
  }, [isLoadingAuth, isLoadingPublicSettings]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth || isCheckingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-4">
        <img
          src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
          alt="Cruise Kauaʻi"
          className="w-48 h-48 object-cover rounded-2xl shadow-lg"
        />
        <h1 className="text-2xl font-bold text-primary tracking-wide">cruise kauaʻi</h1>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Only redirect to login if not on a public page (Welcome, JoinUs, etc.)
      const publicPaths = ['/', '/welcome', '/joinus', '/join', '/trips', '/aboutus', '/about-us', '/contactus', '/contact-us', '/sms-opt-in'];
      const isPublicPath = publicPaths.some(p => window.location.pathname.toLowerCase() === p);
      if (!isPublicPath) {
        navigateToLogin();
        return null;
      }
      // For public pages, fall through and render the app normally
    } else if (authError.type === 'unknown') {
      // Network/load error — still render the app, pages handle their own auth
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper currentPageName="Home"><Home /></LayoutWrapper>} />
      <Route path="/welcome" element={<LayoutWrapper currentPageName="Home"><Home /></LayoutWrapper>} />
      <Route path="/termsofservice" element={<TermsOfService />} />
      <Route path="/privacypolicy" element={<PrivacyPolicy />} />
      <Route path="/bookingsuccess" element={<BookingSuccess />} />
      <Route path="/sms-opt-in" element={<SmsOptIn />} />
      <Route path="/opiosignup" element={<OpioSignup />} />
      <Route path="/kupunasignup" element={<KupunaSignup />} />
      <Route path="/driver-verification" element={<DriverVerificationChart />} />
      <Route path="/contactus" element={<LayoutWrapper currentPageName="Contact Us"><ContactUs /></LayoutWrapper>} />
      <Route path="/contact-us" element={<LayoutWrapper currentPageName="Contact Us"><ContactUs /></LayoutWrapper>} />

      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path.toLowerCase().replace(/ /g, '-')}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/DriverSignupFlow" element={<DriverSignupFlow />} />
      <Route path="/RiderSignupFlow" element={<RiderSignupFlow />} />
      <Route path="/joinus" element={<JoinUs />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/communityforum" element={<LayoutWrapper currentPageName="Community Forum"><CommunityForum /></LayoutWrapper>} />
      <Route path="/communityinstagram" element={<LayoutWrapper currentPageName="Community Instagram"><CommunityInstagram /></LayoutWrapper>} />
      <Route path="/communityrecommendations" element={<LayoutWrapper currentPageName="Community Recommendations"><CommunityRecommendations /></LayoutWrapper>} />
      <Route path="/communityhowtovisit" element={<LayoutWrapper currentPageName="Community How To Visit"><CommunityHowToVisit /></LayoutWrapper>} />
      <Route path="/communityjobs" element={<LayoutWrapper currentPageName="Community Jobs"><CommunityJobs /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


// Redirect preview URL to live domain
if (window.location.hostname === 'preview--ride-connect-b7a57d59.base44.app') {
  window.location.replace('https://www.cruisekauai.org' + window.location.pathname + window.location.search);
}

function App() {
  const [showSplash, setShowSplash] = React.useState(() => {
    // Only show splash once per session
    if (sessionStorage.getItem('splash_shown')) return false;
    sessionStorage.setItem('splash_shown', '1');
    return true;
  });

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App