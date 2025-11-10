import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Car, User, MessageSquare, Ship, ShieldCheck, DollarSign, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "trips",
    url: createPageUrl("Trips"),
    icon: Car,
  },
  {
    title: "account",
    url: createPageUrl("Account"),
    icon: User,
  },
  {
    title: "inbox",
    url: createPageUrl("Inbox"),
    icon: MessageSquare,
  },
  {
    title: "payout",
    url: createPageUrl("Payout"),
    icon: DollarSign,
  },
  {
    title: "contact us",
    url: createPageUrl("ContactUs"),
    icon: MessageSquare,
  },
  {
    title: "admin",
    url: createPageUrl("Admin"),
    icon: ShieldCheck,
    adminOnly: true,
  },
];

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = React.useState(null);
  const [showShareModal, setShowShareModal] = React.useState(false);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (!user.has_seen_welcome && location.pathname !== createPageUrl("Welcome")) {
          navigate(createPageUrl("Welcome"));
        }
      } catch (e) {
        console.error("Error loading user:", e);
      }
    };
    loadUser();
  }, [location.pathname, navigate]);

  return (
    <SidebarProvider>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap');
          
          :root {
            --primary: 34 197 94;
            --primary-foreground: 255 255 255;
            --secondary: 59 130 246;
            --accent: 251 146 60; 
            --background: 255 255 255;
            --card: 243 244 246;
            --border: 229 231 235;
            --muted: 243 244 246;
            --ring: 34 197 94;
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
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="border-b border-border p-6 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-green-400 rounded-2xl flex items-center justify-center shadow-md">
                <Ship className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-blue-500 text-2xl tracking-wide">cruise kauaʻi</h2>
                <p className="text-xs text-gray-500">sharing aloha one ride at a time</p>
              </div>
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors w-full py-2 px-3 rounded-xl hover:bg-gray-50"
            >
              <Share2 className="w-4 h-4" />
              <span>share app</span>
            </button>
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
                          className={`hover:bg-green-50 hover:text-green-700 transition-all duration-200 rounded-2xl mb-1 ${
                            location.pathname === item.url ? 'bg-green-100 text-green-900 shadow-sm font-semibold' : ''
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-border p-4 bg-white">
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
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-border px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-muted p-2 rounded-2xl transition-colors duration-200" />
              <h1 className="text-2xl font-bold text-secondary">cruise kauaʻi</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-background">
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