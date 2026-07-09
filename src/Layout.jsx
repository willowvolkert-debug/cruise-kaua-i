import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, MessageSquare, ShieldCheck, MapPin, Users, CheckCircle, Home, ChevronRight } from "lucide-react";
import { getIslandFromDomain, ISLAND_CONFIG } from "@/lib/islandConfig";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ShareAppModal from "./components/sidebar/ShareAppModal";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const getNavigationItems = (isExploreMode) => {
  const baseItems = [
    {
      title: "trips",
      url: createPageUrl("Trips") + (isExploreMode ? "?explore=true" : ""),
      icon: MapPin,
    },
  ];

  if (!isExploreMode) {
  baseItems.push(
    {
      title: "inbox",
      url: createPageUrl("Inbox"),
      icon: MessageSquare,
    },
    {
      title: "confirmed rides",
      url: createPageUrl("ConfirmedRides"),
      icon: CheckCircle,
    }
  );
  }

  baseItems.push(
    {
      title: "account",
      url: createPageUrl("Account") + (isExploreMode ? "?explore=true" : ""),
      icon: User,
    },
    {
      title: "FAQ & about us",

      url: createPageUrl("AboutUs") + (isExploreMode ? "?explore=true" : ""),
      icon: Users,
    },
    {
      title: "contact us",
      url: createPageUrl("ContactUs") + (isExploreMode ? "?explore=true" : ""),
      icon: MessageSquare,
    },
    {
      title: "community",
      url: createPageUrl("Community") + (isExploreMode ? "?explore=true" : ""),
      icon: Users,
    }
  );

  if (!isExploreMode) {
    baseItems.push(
      {
        title: "admin",
        url: createPageUrl("Admin"),
        icon: ShieldCheck,
        adminOnly: true,
      }
    );
  }

  return baseItems;
};

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

function SidebarContentWrapper({ currentUser, showShareModal, setShowShareModal, location, unreadCount, isExploreMode, currentIsland }) {
  const { setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  const navigationItems = getNavigationItems(isExploreMode);

  return (
    <>
      <SidebarHeader className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <img
            src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
            alt="Cruise Kauaʻi logo"
            className="w-16 h-16 object-cover rounded-xl shadow-sm shrink-0"
            onError={(e) => { e.target.style.display='none'; }}
          />
          <div>
            <h2 className="font-bold text-primary text-xl tracking-wide">{ISLAND_CONFIG[getIslandFromDomain()]?.sidebarLabel || `cruise ${(currentIsland || currentUser?.preferred_island || "kauaʻi").toLowerCase()}`}</h2>
            <p className="text-xs text-gray-500">sharing aloha one ride at a time</p>
          </div>
        </div>
        {!isExploreMode && (
          <Link
            to="/welcome"
            onClick={() => setOpenMobile(false)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors w-full py-2 px-3 rounded-xl hover:bg-gray-100"
          >
            <Home className="w-4 h-4" />
            <span>view welcome page</span>
          </Link>
        )}
      </SidebarHeader>
      
      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">
            navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                if (item.adminOnly && currentUser?.role !== 'admin') return null;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`hover:bg-green-50 hover:text-primary transition-all duration-200 rounded-2xl mb-1 ${
                        location.pathname === item.url ? 'bg-green-100 text-primary shadow-sm font-semibold' : ''
                      }`}
                    >
                      <Link to={item.url} onClick={handleNavClick} className="flex items-center gap-3 px-4 py-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                        {item.title === "inbox" && unreadCount > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-3 bg-white">
        {currentUser && (
          <Link
            to="/account"
            onClick={handleNavClick}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-green-50 transition-colors group"
          >
            <Avatar className="w-12 h-12 shrink-0">
              <AvatarImage src={currentUser.profile_picture_url} />
              <AvatarFallback className="bg-gradient-to-r from-primary to-green-400 text-white font-bold text-base">
                {getInitials(currentUser.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-base truncate">
                {currentUser.full_name || 'Your Name'}
              </p>
              <p className="text-sm text-gray-500 truncate">
                @{currentUser.username || 'user'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
          </Link>
        )}
      </SidebarFooter>
    </>
  );
}

function CustomSidebarTrigger() {
  const { setOpenMobile } = useSidebar();
  return (
    <button
      onClick={() => setOpenMobile(true)}
      data-sidebar="trigger"
      className="hover:bg-gray-100 p-1 rounded-xl transition-colors duration-200 shrink-0 flex items-center justify-center"
    >
      <img
        src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
        alt="Menu"
        className="w-8 h-8 rounded-lg object-cover"
      />
    </button>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = React.useState(null);
  const [showShareModal, setShowShareModal] = React.useState(false);

  const [touchStart, setTouchStart] = React.useState(null);
  const [touchEnd, setTouchEnd] = React.useState(null);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const sidebarRef = React.useRef(null);
  const [isExploreMode, setIsExploreMode] = React.useState(false);
  const [currentIsland, setCurrentIsland] = React.useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    // Only track swipes starting from the left edge (within 50px)
    if (e.targetTouches[0].clientX > 50) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    if (!touchStart) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchEnd - touchStart;
    const isRightSwipe = distance > minSwipeDistance;
    if (isRightSwipe && touchStart < 50) {
      // Trigger sidebar open on right swipe from left edge
      const trigger = document.querySelector('[data-sidebar="trigger"]');
      if (trigger) trigger.click();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Track last activity date (throttled to once per ~6 hours to avoid DB churn)
        try {
          const now = new Date();
          const last = user.last_activity_date ? new Date(user.last_activity_date) : null;
          if (!last || (now - last) > 6 * 60 * 60 * 1000) {
            base44.auth.updateMe({ last_activity_date: now.toISOString() }).catch(() => {});
          }
        } catch (e) { /* non-critical */ }

        if (!user.has_seen_welcome) {
          // Mark as seen since they're authenticated — no need to redirect back to Welcome
          base44.auth.updateMe({ has_seen_welcome: true });
        }

        // Send welcome email immediately on first load if not yet sent
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
        // Skip the old tutorial intro for new users — WelcomeNewUserModal handles onboarding now

        // Load unread counts
        loadUnreadCount(user);
      } catch (e) {
        // Only redirect to login on a definitive 401 auth error, not network/transient errors
        const is401 = e?.status === 401 || e?.response?.status === 401;
        if (is401) {
          const publicPaths = ['/', '/welcome', createPageUrl("AboutUs"), createPageUrl("ContactUs"), '/joinus', '/join', '/trips'];
          if (!publicPaths.includes(location.pathname.toLowerCase())) {
            const next = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/join?next=${next}`;
          }
        }
        // For any other error (network issues etc.), stay on the page — don't log the user out
      }
    };

    const loadUnreadCount = async (user) => {
      try {
        const [bookings, adminMessages] = await Promise.all([
          base44.entities.RideBooking.list(),
          base44.entities.AdminMessage.list()
        ]);

        let count = 0;

        // Count pending requests for driver (where user is driver)
        const pendingRequests = bookings.filter(b => 
          String(b.driver_id) === String(user.id) && 
          b.booking_status === 'pending' &&
          b.payment_status === 'paid'
        );
        count += pendingRequests.length;

        // Count unread admin messages
        const unreadAdminMessages = adminMessages.filter(m => 
          m.recipient_id === user.id && !m.is_read
        );
        count += unreadAdminMessages.length;

        // Count bookings with unread messages (messages since user last opened the chat)
        // Only count active bookings — cancelled/rejected won't appear in inbox
        const bookingsWithNewMessages = bookings.filter(b => {
          if (b.booking_status === 'cancelled' || b.booking_status === 'rejected') return false;
          const isInvolved = String(b.driver_id) === String(user.id) || String(b.passenger_id) === String(user.id);
          if (!isInvolved || !b.messages || b.messages.length === 0) return false;
          const totalMessages = b.messages.length;
          const readCount = (b.read_message_counts || {})[user.id] || 0;
          // There are unread messages if total > read AND last message is from the other party
          const lastMsg = b.messages[totalMessages - 1];
          return totalMessages > readCount && String(lastMsg.sender_id) !== String(user.id);
        });
        count += bookingsWithNewMessages.length;

        setUnreadCount(count);
      } catch (e) {
        console.error("Error loading unread count:", e);
      }
    };

    loadUser();

    // Listen for island changes
    const handleIslandChanged = (e) => setCurrentIsland(e.detail);
    window.addEventListener('islandChanged', handleIslandChanged);


    
    // Refresh unread count periodically
    const interval = setInterval(() => {
      if (currentUser) loadUnreadCount(currentUser);
    }, 30000);

    return () => {
      window.removeEventListener('islandChanged', handleIslandChanged);

      clearInterval(interval);
    };
  }, [location.pathname, navigate]);

  return (
    <SidebarProvider>
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
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-gray-200 bg-gray-50">
          <SidebarContentWrapper 
            currentUser={currentUser} 
            showShareModal={showShareModal} 
            setShowShareModal={setShowShareModal}
            location={location}
            unreadCount={unreadCount}
            isExploreMode={isExploreMode}
            currentIsland={currentIsland}
          />
        </Sidebar>

        <main 
                      className="flex-1 flex flex-col"
                    >
                      <header className="bg-white border-b border-gray-200 px-2 py-2 md:hidden">
                        <div className="flex items-center gap-1 w-full">
                          <CustomSidebarTrigger />
                          <nav className="flex flex-1 items-center justify-between">
                            {[
                              { label: "trips", path: "/trips" },
                              { label: "inbox", path: "/inbox" },
                              { label: "confirmed", path: "/confirmedrides" },
                              { label: "account", path: "/account" },
                            ].map(({ label, path }) => {
                              const isActive = location.pathname.toLowerCase() === path || 
                                (path === "/trips" && location.pathname === "/");
                              return (
                                <Link
                                 key={path}
                                 to={path}
                                 className={`flex-1 text-center text-xs font-semibold py-6 mx-0.5 rounded-full transition-colors ${
                                   isActive
                                     ? "border-2 border-green-400 text-primary bg-green-50"
                                     : "text-gray-500 hover:text-primary"
                                 }`}
                                >
                                 {label}
                                 {label === "inbox" && unreadCount > 0 && (
                                   <span className="ml-1 bg-red-500 text-white text-[10px] px-1 py-0.5 rounded-full">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                 )}
                                </Link>
                              );
                            })}
                          </nav>
                        </div>
                      </header>

                      <div className="flex-1 bg-white" style={{WebkitOverflowScrolling: 'touch', overflowX: 'hidden'}}>
                        {children}
                      </div>
                    </main>
      </div>

      <ShareAppModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)}
        currentUser={currentUser}
      />



    </SidebarProvider>
  );
}