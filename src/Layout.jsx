import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, MessageSquare, ShieldCheck, Share2, MapPin, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ShareAppModal from "./components/sidebar/ShareAppModal";
import AppTutorial from "./components/tutorial/AppTutorial";
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
    {
      title: "account",
      url: createPageUrl("Account") + (isExploreMode ? "?explore=true" : ""),
      icon: User,
    },
  ];

  if (!isExploreMode) {
    baseItems.push(
      {
        title: "inbox & confirmed rides",
        url: createPageUrl("Inbox"),
        icon: MessageSquare,
      }
    );
  }

  baseItems.push(
    {
      title: "contact us",
      url: createPageUrl("ContactUs") + (isExploreMode ? "?explore=true" : ""),
      icon: MessageSquare,
    }
  );

  if (!isExploreMode) {
    baseItems.push(
      {
        title: "community",
        url: createPageUrl("Community"),
        icon: Users,
      },
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
            className="w-12 h-12 object-cover rounded-xl shadow-sm shrink-0"
            onError={(e) => { e.target.style.display='none'; }}
          />
          <div>
            <h2 className="font-bold text-blue-500 text-xl tracking-wide">cruise {(currentIsland || currentUser?.preferred_island || "kauaʻi").toLowerCase()}</h2>
            <p className="text-xs text-gray-500">sharing aloha one ride at a time</p>
          </div>
        </div>
        {!isExploreMode && (
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors w-full py-2 px-3 rounded-xl hover:bg-gray-100"
          >
            <Share2 className="w-4 h-4" />
            <span>share app</span>
          </button>
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
                      className={`hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 rounded-2xl mb-1 ${
                        location.pathname === item.url ? 'bg-orange-100 text-orange-900 shadow-sm font-semibold' : ''
                      }`}
                    >
                      <Link to={item.url} onClick={handleNavClick} className="flex items-center gap-3 px-4 py-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                        {item.title === "inbox & confirmed rides" && unreadCount > 0 && (
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

      <SidebarFooter className="border-t border-gray-200 p-4 bg-white">
        {currentUser && (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={currentUser.profile_picture_url} />
              <AvatarFallback className="bg-gradient-to-r from-primary to-green-400 text-white font-semibold">
                {getInitials(currentUser.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-700 text-sm truncate">
                @{currentUser.username || 'user'}
              </p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = React.useState(null);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showTutorial, setShowTutorial] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState(null);
  const [touchEnd, setTouchEnd] = React.useState(null);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const sidebarRef = React.useRef(null);
  const [isExploreMode, setIsExploreMode] = React.useState(false);
  const [currentIsland, setCurrentIsland] = React.useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
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
    // Check for explore mode
    const urlParams = new URLSearchParams(window.location.search);
    const exploreParam = urlParams.get('explore');
    setIsExploreMode(exploreParam === 'true');

    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (!user.has_seen_welcome) {
          // Mark as seen since they're authenticated — no need to redirect back to Welcome
          base44.auth.updateMe({ has_seen_welcome: true });
        }
        if (!user.has_seen_tutorial && (location.pathname === createPageUrl("Trips") || location.pathname === "/")) {
          setShowTutorial(true);
        }

        // Load unread counts
        loadUnreadCount(user);
      } catch (e) {
        // User not authenticated - redirect to Welcome page unless already there or exploring
        if (!exploreParam && location.pathname !== createPageUrl("Welcome") && 
            location.pathname !== createPageUrl("ContactUs") && 
            location.pathname !== createPageUrl("Account")) {
          navigate(createPageUrl("Welcome"));
        }
        console.error("Error loading user:", e);
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

        setUnreadCount(count);
      } catch (e) {
        console.error("Error loading unread count:", e);
      }
    };

    loadUser();

    // Listen for island changes
    const handleIslandChanged = (e) => setCurrentIsland(e.detail);
    window.addEventListener('islandChanged', handleIslandChanged);

    // Listen for tutorial trigger
    const handleOpenTutorial = () => setShowTutorial(true);
    window.addEventListener('openTutorial', handleOpenTutorial);
    
    // Refresh unread count periodically
    const interval = setInterval(() => {
      if (currentUser) loadUnreadCount(currentUser);
    }, 30000);

    return () => {
      window.removeEventListener('islandChanged', handleIslandChanged);
      window.removeEventListener('openTutorial', handleOpenTutorial);
      clearInterval(interval);
    };
  }, [location.pathname, navigate]);

  return (
    <SidebarProvider>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap');
          
          :root {
            --primary: 251 146 60;
            --primary-foreground: 255 255 255;
            --secondary: 59 130 246;
            --accent: 148 163 184;
            --background: 255 255 255;
            --card: 249 250 251;
            --border: 209 213 219;
            --muted: 243 244 246;
            --ring: 251 146 60;
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
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    >
                      <header className="bg-white border-b border-gray-200 px-4 py-3 md:hidden">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <SidebarTrigger data-sidebar="trigger" className="hover:bg-gray-100 p-2 rounded-2xl transition-colors duration-200" />
                            <h1 className="text-lg font-bold text-secondary">cruise {(currentIsland || currentUser?.preferred_island || "kauaʻi").toLowerCase()}</h1>
                          </div>
                          <img
                            src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
                            alt="Cruise Kauaʻi logo"
                            className="w-9 h-9 object-cover rounded-lg"
                          />
                        </div>
                      </header>

                      <div className="flex-1 overflow-auto bg-white">
                        {children}
                      </div>
                    </main>
      </div>

      <ShareAppModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)}
        currentUser={currentUser}
      />

      <AppTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </SidebarProvider>
  );
}