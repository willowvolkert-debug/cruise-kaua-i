import React from "react";
import { MapPin, ChevronLeft, Calendar, ChevronDown, RefreshCw } from "lucide-react";
import FindRide from "../components/trips/FindRide";
import RequestRide from "../components/trips/RequestRide";
import PostRideForm from "../components/trips/PostRideForm";
import NeedHelpButton from "../components/trips/NeedHelpButton";
import WelcomeTutorialModal from "../components/tutorial/WelcomeTutorialModal";
import { base44 } from "@/api/base44Client";
import { getIslandFromDomain } from "@/lib/islandConfig";
import { format, addDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import RouteSearch from "../components/trips/RouteSearch";
import BrowseRideRequests from "../components/trips/BrowseRideRequests";
import HaenaWarningCard from "../components/trips/HaenaWarningCard";
import HaenaInfoView from "../components/trips/HaenaInfoView";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

const ISLANDS = ["Kauai", "Oahu", "Maui", "Big Island"];

// view: null | "menu" | "request" | "post" | "view_sub" | "view_week" | "view_date" | "view_route"

export default function TripsPage() {
  const [showTutorial, setShowTutorial] = React.useState(false);
  const [isExploreMode, setIsExploreMode] = React.useState(false);
  const [selectedIsland, setSelectedIsland] = React.useState(getIslandFromDomain());
  const [islandLoaded, setIslandLoaded] = React.useState(false);
  const [islandSelectorVisible, setIslandSelectorVisible] = React.useState(false);
  const [view, setView] = React.useState("menu");
  const [specificDate, setSpecificDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [appliedDate, setAppliedDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [prefillRequest, setPrefillRequest] = React.useState(null);

  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      setRefreshKey(k => k + 1);
      // Wait a beat for components to re-mount with new key
      await new Promise(r => setTimeout(r, 600));
    }
  });

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsExploreMode(urlParams.get('explore') === 'true');
    const viewParam = urlParams.get('view');
    if (viewParam) setView(viewParam);

    const domainIsland = getIslandFromDomain();
    base44.auth.me().then(user => {
      const hostname = window.location.hostname.toLowerCase();
      const isGenericDomain = !hostname.includes('cruisekauai') && !hostname.includes('cruiseoahu') && !hostname.includes('cruisemaui') && !hostname.includes('cruisebigisland');
      if (isGenericDomain && user?.preferred_island) {
        setSelectedIsland(user.preferred_island);
      } else {
        setSelectedIsland(domainIsland);
      }
      setIslandLoaded(true);
    }).catch(() => setIslandLoaded(true));
  }, []);

  const handleIslandChange = async (island) => {
    setSelectedIsland(island);
    window.dispatchEvent(new CustomEvent('islandChanged', { detail: island }));
    try { await base44.auth.updateMe({ preferred_island: island }); } catch (e) {}
  };

  React.useEffect(() => {
    if (islandLoaded) {
      window.dispatchEvent(new CustomEvent('islandChanged', { detail: selectedIsland }));
    }
  }, [islandLoaded, selectedIsland]);

  const goBack = () => {
    if (view === "haena_info") setView("view_sub");
    else if (view === "view_sub" || view === "request" || view === "post" || view === "browse_requests") setView("menu");
    else if (view === "view_week" || view === "view_date" || view === "view_route") setView("view_sub");
  };

  const showBack = view !== "menu";

  return (
    <div className="p-3 md:p-8 bg-background overflow-x-hidden min-h-screen">
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center text-primary transition-opacity"
          style={{ height: `${pullDistance}px`, opacity: pullDistance > 0 ? 1 : 0 }}
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      )}
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {showBack && (
                <button onClick={goBack} className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium text-sm">
                  <ChevronLeft className="w-5 h-5" /> back
                </button>
              )}
              {!showBack && <h1 className="text-2xl md:text-3xl font-bold text-secondary">plan your trip</h1>}
            </div>
            <NeedHelpButton onOpenTutorial={() => setShowTutorial(true)} />
          </div>

          {/* Island Selector */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium">island:</span>
              <button
                onClick={() => setIslandSelectorVisible(v => !v)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
              >
                {islandSelectorVisible ? "hide" : "change"}
              </button>
            </div>
            {islandSelectorVisible ? (
              <div className="flex flex-wrap gap-2">
                {ISLANDS.map(island => (
                  <button
                    key={island}
                    onClick={() => { handleIslandChange(island); setIslandSelectorVisible(false); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedIsland === island ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {island}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-sm font-medium text-primary">{selectedIsland}</span>
            )}
          </div>

          {isExploreMode && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl">
              <p className="text-blue-800 text-sm">
                You're in explore mode.{" "}
                <button onClick={() => window.location.href = '/'} className="underline font-semibold">Sign up</button>
                {" "}to post rides and book trips!
              </p>
            </div>
          )}
        </div>

        {/* ── MENU ── */}
        {view === "menu" && (
          <div className="space-y-4">
            <p className="text-lg font-semibold text-gray-700 mb-2">what would you like to do?</p>
            {[
              { id: "view_sub", emoji: "🔍", label: "get a ride", desc: "Browse available rides to see how you could get around when your schedule is flexible" },
              { id: "post", emoji: "🚗", label: "post a ride", desc: "Offer seats on the trips you're already making — whether it's your commute, an errand run, or going camping. By offering seats, you can save ~$1000 per year on vehicle costs." },
              { id: "browse_requests", emoji: "📋", label: "see ride requests", desc: "Browse open ride requests from riders looking for a ride. Message them or post a matching ride to help someone out." },
              { id: "request", emoji: "🙋", label: "request a ride", desc: "Post a ride request so drivers know you need one. Best for airport runs & doctor's appts — schedule at least 24 hrs in advance for the best chance someone can give you a ride." },
            ].map(({ id, emoji, label, desc }) => (
              <button
                key={id}
                onClick={() => {
                  if (id === "post") {
                    base44.analytics.track({ eventName: "post_ride_button_clicked" });
                  }
                  setView(id);
                }}
                className="w-full flex items-center gap-5 p-5 rounded-3xl border-2 border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <span className="text-4xl shrink-0">{emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-primary rotate-180 shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        )}

        {/* ── VIEW SUB-MENU ── */}
        {view === "view_sub" && (
          <div className="space-y-4">
            <p className="text-lg font-semibold text-gray-700 mb-2">what would you like to view?</p>
            <button
              onClick={() => setView("view_week")}
              className="w-full flex items-center gap-5 p-5 rounded-3xl border-2 border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
            >
              <span className="text-4xl shrink-0">📅</span>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">view all rides posted this week</p>
                <p className="text-gray-500 text-sm mt-0.5">See everything available in the next 7 days</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-primary rotate-180 shrink-0 transition-colors" />
            </button>

            <button
              onClick={() => setView("view_date")}
              className="w-full flex items-center gap-5 p-5 rounded-3xl border-2 border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
            >
              <span className="text-4xl shrink-0">🗓️</span>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">view rides for a specific date</p>
                <p className="text-gray-500 text-sm mt-0.5">Pick a date and see what's available</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-primary rotate-180 shrink-0 transition-colors" />
            </button>

            <button
              onClick={() => setView("view_route")}
              className="w-full flex items-center gap-5 p-5 rounded-3xl border-2 border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
            >
              <span className="text-4xl shrink-0">📍</span>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">specific route</p>
                <p className="text-gray-500 text-sm mt-0.5">Find rides passing through your origin & destination</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-primary rotate-180 shrink-0 transition-colors" />
            </button>

            <HaenaWarningCard onClick={() => setView("haena_info")} />
          </div>
        )}

        {/* ── HĀʻENA INFO ── */}
        {view === "haena_info" && <HaenaInfoView onBack={() => setView("view_sub")} />}
        {view === "view_date" && (
          <div className="space-y-5">
            <p className="text-lg font-semibold text-gray-700">pick a date</p>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-semibold text-gray-800 text-base">
                      {specificDate ? format(parseISO(specificDate), "EEEE, MMMM do, yyyy") : "select a date"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                <CalendarPicker
                  mode="single"
                  selected={specificDate ? parseISO(specificDate) : undefined}
                  onSelect={(date) => {
                    if (date) setSpecificDate(format(date, 'yyyy-MM-dd'));
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              onClick={() => setAppliedDate(specificDate)}
              disabled={!specificDate}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 text-base font-bold"
            >
              find rides for this date 🔍
            </Button>
            {appliedDate && (
              <FindRide
                key={appliedDate}
                island={selectedIsland}
                initialStartDate={appliedDate}
                initialEndDate={appliedDate}
                hideDateFilter
                onRequestRide={() => setView("request")}
              />
            )}
          </div>
        )}

        {/* ── VIEW THIS WEEK ── */}
        {view === "view_week" && (
          <FindRide
            key={`week-${refreshKey}`}
            island={selectedIsland}
            initialStartDate={format(new Date(), 'yyyy-MM-dd')}
            initialEndDate={format(addDays(new Date(), 7), 'yyyy-MM-dd')}
            onRequestRide={() => setView("request")}
          />
        )}

        {/* ── VIEW ROUTE ── */}
        {view === "view_route" && <RouteSearch island={selectedIsland} onRequestRide={() => setView("request")} />}

        {/* ── BROWSE RIDE REQUESTS ── */}
        {view === "browse_requests" && (
          <BrowseRideRequests
            island={selectedIsland}
            onRespondWithRide={(request) => {
              setPrefillRequest(request);
              setView("post");
            }}
          />
        )}

        {/* ── REQUEST ── */}
        {view === "request" && <RequestRide island={selectedIsland} />}

        {/* ── POST ── */}
        {view === "post" && <PostRideForm island={selectedIsland} initialRespondingToRequest={prefillRequest} />}

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Cruise Hawaiʻi. Specializing in carpooling and ridesharing across Hawaiʻi.
        </footer>
      </div>

      <WelcomeTutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}