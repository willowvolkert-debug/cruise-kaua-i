import React from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BottomNav from "@/components/BottomNav";
import BrandHeader from "@/components/BrandHeader";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Track last activity date (throttled to once per ~6 hours)
        try {
          const now = new Date();
          const last = user.last_activity_date ? new Date(user.last_activity_date) : null;
          if (!last || (now - last) > 6 * 60 * 60 * 1000) {
            base44.auth.updateMe({ last_activity_date: now.toISOString() }).catch(() => {});
          }
        } catch (e) { /* non-critical */ }

        if (!user.has_seen_welcome) {
          base44.auth.updateMe({ has_seen_welcome: true });
        }

        // EMAIL HALT: Welcome email disabled per admin request
        // if (!user.onboarding_email_sent) {
        //   import('@/functions/sendWelcomeEmail').then(({ sendWelcomeEmail }) => {
        //     sendWelcomeEmail({});
        //   }).catch(() => {});
        // }

        // Check for admin-posted ride requests to claim (once per session)
        if (!sessionStorage.getItem('ride_posts_checked')) {
          sessionStorage.setItem('ride_posts_checked', '1');
          import('@/functions/linkPendingRidePosts').then(({ linkPendingRidePosts }) => {
            linkPendingRidePosts({}).catch(() => {});
          }).catch(() => {});
        }
      } catch (e) {
        // Only redirect to login on a definitive 401, not network/transient errors
        const is401 = e?.status === 401 || e?.response?.status === 401;
        if (is401) {
          const publicPaths = ['/', '/welcome', '/joinus', '/join', '/home', '/account', '/trips', '/contactus', '/contact-us', '/aboutus', '/about-us', '/sms-opt-in', '/termsofservice', '/privacypolicy'];
          if (!publicPaths.includes(location.pathname.toLowerCase())) {
            const next = encodeURIComponent(window.location.pathname + window.location.search);
            // login=true so the Join page shows the login view (not step 5 of the signup wizard)
            window.location.href = `/join?login=true&next=${next}`;
          }
        }
      }
    };

    loadUser();
  }, [location.pathname]);

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap');

          :root {
            --font-sans: 'Nunito', sans-serif;
          }

          body {
            font-family: var(--font-sans);
            background-color: hsl(var(--background));
          }

          h1, h2, h3, h4, h5, h6, p, span, label, button, div {
            font-family: var(--font-sans);
          }

          h1, h2, h3, h4, h5, h6 {
            color: hsl(var(--secondary));
          }
        `}
      </style>
      <div className="min-h-screen flex flex-col w-full bg-background">
        <BrandHeader
          right={!currentUser && (
            <Link
              to="/join?login=true"
              className="text-sm font-bold text-primary border-2 border-primary rounded-full px-3 py-1 hover:bg-primary/5 transition-colors"
            >
              log in
            </Link>
          )}
        />
        <div className="flex-1 bg-background pb-16 md:pb-0" style={{ WebkitOverflowScrolling: 'touch', overflowX: 'hidden' }}>
          {children}
        </div>
        <BottomNav />
      </div>
    </>
  );
}