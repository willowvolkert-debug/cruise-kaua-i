import React, { useState, useEffect } from "react";
import { MapPin, Calendar, RefreshCw, Users } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WelcomeTutorialModal from "@/components/tutorial/WelcomeTutorialModal";
import WelcomeHero from "@/components/welcome/WelcomeHero";
import MissionSlide from "@/components/welcome/MissionSlide";
import HowItWorks from "@/components/welcome/HowItWorks";
import GreySkies from "@/components/welcome/GreySkies";
import PoolsSection from "@/components/welcome/PoolsSection";
import WelcomeFaq from "@/components/welcome/WelcomeFaq";
import { trackPageView } from "@/functions/trackPageView";
import { getPublicRides } from "@/functions/getPublicRides";

export default function WelcomePage() {
  const navigate = useNavigate();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const nextWeekStr = format(addDays(today, 7), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextWeekStr);
  const [rides, setRides] = useState([]);
  const [isLoadingRides, setIsLoadingRides] = useState(true);
  const [showRides, setShowRides] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    loadRides();
    trackPageView({ page_name: 'Welcome' }).catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tutorial') === 'true') setShowTutorial(true);
  }, []);

  const loadRides = async (start = startDate, end = endDate) => {
    setIsLoadingRides(true);
    try {
      const result = await getPublicRides({ start_date: start, end_date: end });
      setRides(result.data?.rides || []);
    } catch (e) {
      console.error("Error loading rides:", e);
      setRides([]);
    }
    setIsLoadingRides(false);
  };

  const ridesByDate = rides.reduce((acc, ride) => {
    if (!acc[ride.departure_date]) acc[ride.departure_date] = [];
    acc[ride.departure_date].push(ride);
    return acc;
  }, {});

  const handleSignUp = () => navigate("/join");
  const handleExplore = () => navigate(createPageUrl("Trips") + "?explore=true&view=view_week");

  return (
    <div className="min-h-screen bg-[#F1EDE1] overflow-x-hidden">
      <WelcomeHero
        onLogin={() => navigate(`/join?next=${encodeURIComponent('/trips')}&login=true`)}
        onSignUp={handleSignUp}
        onExplore={handleExplore} />
      <MissionSlide />
      <HowItWorks onSignUp={handleSignUp} />
      <GreySkies />
      <PoolsSection />
      <WelcomeFaq />

      {/* ── VIEW RIDES ── */}
      <section className="px-4 pb-10 bg-[#F1EDE1]">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <button
            onClick={() => setShowTutorial(true)}
            className="cruise-body text-lg text-[#2b1a1a]/70 hover:text-[#2b1a1a] underline underline-offset-2 transition-colors block mx-auto">
            watch the welcome tutorial →
          </button>
          <button
            onClick={() => setShowRides(!showRides)}
            className="cruise-body text-lg text-[#C64D50] hover:text-[#a53f42] underline underline-offset-2 transition-colors">
            {showRides ? 'hide rides ↑' : 'view all available rides →'}
          </button>

          {showRides &&
          <div className="text-left space-y-4 pt-2 pb-8">
              <div className="flex items-end gap-2">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs text-gray-500">from</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl text-sm h-9" />
                </div>
                <span className="text-gray-400 mb-2 text-sm">→</span>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs text-gray-500">to</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl text-sm h-9" />
                </div>
                <button
                onClick={() => loadRides(startDate, endDate)}
                disabled={isLoadingRides}
                className="mb-0 h-9 px-3 bg-[#C64D50] text-white rounded-xl text-sm hover:bg-[#a53f42] shrink-0">
                  <RefreshCw className={`w-4 h-4 ${isLoadingRides ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingRides ?
            <div className="text-center py-6 text-gray-400 text-sm">loading rides...</div> :
            Object.keys(ridesByDate).length === 0 ?
            <div className="text-center py-6 text-gray-400 text-sm">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  no rides posted for this date range
                </div> :

            <div className="space-y-4">
                  {Object.entries(ridesByDate).
              sort(([a], [b]) => new Date(a) - new Date(b)).
              map(([date, dateRides]) =>
              <div key={date}>
                        <p className="text-xs font-semibold text-[#4F8FD3] flex items-center gap-1 mb-2">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(date), 'MM/dd/yyyy')}
                        </p>
                        <div className="space-y-2">
                          {dateRides.
                  sort((a, b) => (a.departure_time || '').localeCompare(b.departure_time || '')).
                  map((ride) =>
                  <div key={ride.id} className="border-2 border-[#2b1a1a]/20 rounded-2xl p-4 bg-white space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-extrabold text-gray-900 text-base leading-tight truncate">
                                    {ride.departure_location} → {ride.destination}
                                  </p>
                                  <p className="font-bold text-lg text-[#C64D50] shrink-0">${ride.price_per_seat_tourist || ride.price_per_seat || 0}<span className="text-xs font-normal text-gray-400">/seat</span></p>
                                </div>
                                <p className="text-sm text-[#4F8FD3] font-medium">{ride.departure_time || 'Flexible time'}</p>
                                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={ride.driver_profile_picture_url} />
                                      <AvatarFallback className="bg-[#89AF76] text-white text-xs">{(ride.driver_name || 'DR').split(' ').map((n) => n[0]).join('').toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-gray-500">@{ride.driver_username || ride.driver_name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Users className="w-3 h-3" />
                                    <span className="text-xs">{ride.seats_available} seats</span>
                                  </div>
                                </div>
                              </div>
                  )}
                        </div>
                      </div>
              )}
                  <div className="text-center pt-2">
                    <button
                  onClick={handleSignUp}
                  className="cruise-body text-lg text-[#C64D50] underline underline-offset-2 transition-colors">
                      sign up to book a ride →
                    </button>
                  </div>
                </div>
            }
            </div>
          }
        </div>
      </section>

      <WelcomeTutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* ── FOOTER ── */}
      <footer className="bg-[#2b1a1a] text-[#D0C6C7] px-6 py-8 text-center space-y-3">
        <p className="cruise-head text-[#F1EDE1] text-3xl">cruise hawaiʻi</p>
        <p className="cruise-body text-lg">sharing aloha one ride at a time</p>
        <div className="cruise-body flex flex-wrap items-center justify-center gap-4 text-base pt-1">
          <a href="/termsofservice" className="hover:text-white underline underline-offset-2 transition-colors">Terms of Service</a>
          <span>·</span>
          <a href="/privacypolicy" className="hover:text-white underline underline-offset-2 transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="/sms-opt-in" className="hover:text-white underline underline-offset-2 transition-colors">SMS Notifications</a>
          <span>·</span>
          <a href="mailto:cruisekauai@gmail.com" className="hover:text-white underline underline-offset-2 transition-colors">cruisekauai@gmail.com</a>
        </div>
        <p className="text-xs text-[#D0C6C7]/60 pt-2">© {new Date().getFullYear()} Cruise. All rights reserved.</p>
      </footer>
    </div>);

}