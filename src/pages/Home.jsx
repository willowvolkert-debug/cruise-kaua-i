import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import TripsPage from "./Trips";
import InboxPage from "./Inbox";
import ConfirmedRidesPage from "./ConfirmedRides";
import AccountPage from "./Account";
import CommunityPage from "./Community";
import AboutUsPage from "./AboutUs";
import ContactUsPage from "./ContactUs";
import AdminPage from "./Admin";

export default function Home() {
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    base44.auth.me()
      .then((user) => setIsAdmin(user?.role === "admin"))
      .catch(() => {});
  }, []);

  const tabs = [
    { value: "trips", label: "🚗 trips", content: <TripsPage /> },
    { value: "inbox", label: "💬 inbox", content: <InboxPage /> },
    { value: "confirmed", label: "✅ confirmed", content: <ConfirmedRidesPage /> },
    { value: "account", label: "👤 account", content: <AccountPage /> },
    { value: "about", label: "ℹ️ about", content: <AboutUsPage /> },
    { value: "contact", label: "✉️ contact", content: <ContactUsPage /> },
    { value: "community", label: "🌺 community", content: <CommunityPage /> },
  ];

  if (isAdmin) {
    tabs.push({ value: "admin", label: "🛡️ admin", content: <AdminPage /> });
  }

  return (
    <div className="bg-white min-h-screen">
      <Tabs defaultValue="trips" className="w-full">
        <div className="border-b border-gray-100 bg-white sticky top-14 z-20">
          <TabsList className="flex w-full max-w-3xl mx-auto h-auto bg-transparent p-2 gap-1 overflow-x-auto justify-start sm:justify-center rounded-none">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="rounded-2xl whitespace-nowrap px-4 py-2 text-gray-600 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-0 focus-visible:outline-none">
            {t.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}