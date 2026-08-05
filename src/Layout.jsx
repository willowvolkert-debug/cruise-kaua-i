import React from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";

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

        // Send welcome email on first load if not yet sent
        if (!user.onboarding_email_sent) {
          import('@/functions/sendWelcomeEmail').then(({ sendWelcomeEmail }) => {
            sendWelcomeEmail({});
          }).catch(() => {});
        }

        // Check for admin-posted ride requests to claim (once per session)
        if (!sessionStorage.getItem('ride_posts_checked')) {
          sessionStorage.setItem('ride_posts_checked', '1');
          import('@/functions/linkPendingRidePosts').then(({ linkPendingRidePosts }) => {
            linkPendingRidePosts({}).catch(() => {});
          }).catch(() => {});
        }
      } catch (e) {
        // Guest user or transient error — let them browse freely
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
        <header className="bg-white border-b border-gray-200 h-14 px-4 flex items-center justify-between gap-3 sticky top-0 z-30">
          <span className="text-xs text-gray-500 truncate flex-1 min-w-0">press on logo to return to home screen/navigate</span>
          <div className="flex items-center gap-3 shrink-0">
            {!currentUser && (
              <Link
                to="/join"
                className="text-sm font-bold text-primary border border-primary rounded-full px-4 py-1.5 hover:bg-primary/5 transition-colors"
              >
                sign up
              </Link>
            )}
            <Link to="/home" className="flex items-center gap-2">
              <img
                src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
                alt="Cruise Kauaʻi"
                className="w-9 h-9 rounded-xl object-cover"
              />
              <span className="font-bold text-primary text-lg tracking-wide hidden sm:block">cruise kauaʻi</span>
            </Link>
          </div>
        </header>
        <div className="flex-1 bg-white" style={{ WebkitOverflowScrolling: 'touch', overflowX: 'hidden' }}>
          {children}
        </div>
      </div>
    </>
  );
}