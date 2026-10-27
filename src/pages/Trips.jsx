import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronLeft, Calendar, ChevronDown, RefreshCw } from "lucide-react";
import FindRide from "../components/trips/FindRide";
import RequestRide from "../components/trips/RequestRide";
import PostRideForm from "../components/trips/PostRideForm";
import NeedHelpButton from "../components/trips/NeedHelpButton";
import WelcomeTutorialModal from "../components/tutorial/WelcomeTutorialModal";
import { base44 } from "@/api/base44Client";
import { getIsland } from "@/lib/island";
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
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = React.useState(false);
  const [isExploreMode, setIsExploreMode] = React.useState(false);
  const [selectedIsland, setSelectedIsland] = React.useState(getIsland());
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
    else navigate("/home", { replace: true });

  }, []);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('islandChanged', { detail: selectedIsland }));
  }, [selectedIsland]);

  const goBack = () => {
    if (view === "haena_info") setView("view_sub");
    else navigate("/home");
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
                <button onClick={goBack} className="flex items-center gap-1 text-primary-foreground bg-primary hover:bg-primary/90 transition-colors font-bold text-base rounded-full pl-2 pr-4 py-2 select-none">
                  <ChevronLeft className="w-5 h-5" /> back
                </button>
              )}
              {!showBack && <h1 className="text-2xl md:text-3xl font-bold text-secondary">plan your trip</h1>}
            </div>
            <NeedHelpButton onOpenTutorial={() => setShowTutorial(true)} />
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
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-secondary">view all rides posted this week</h2>
              <p className="text-lg text-gray-700 mt-2 leading-snug">
                Use the <strong>date filter</strong> to pick a day (then tap find rides), and the <strong>route filter</strong> to type where you're starting and where you're headed. Leave the route blank to see everything.
              </p>
              <p className="text-xl font-semibold text-gray-800 mt-4">Don't see a ride that fits your plans?</p>
              <Button
                onClick={() => setView("request")}
                className="mt-2 w-full bg-primary hover:bg-primary/90 text-white rounded-lg h-16 text-xl font-bold"
              >
                🙋 request here
              </Button>
            </div>
            <FindRide
              key={`week-${refreshKey}`}
              island={selectedIsland}
              initialStartDate={format(new Date(), 'yyyy-MM-dd')}
              initialEndDate={format(addDays(new Date(), 7), 'yyyy-MM-dd')}
              onRequestRide={() => setView("request")}
            />
          </div>
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