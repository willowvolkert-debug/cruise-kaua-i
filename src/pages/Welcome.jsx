import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Shield, Users, Leaf, CheckCircle, MapPin, Calendar, RefreshCw, Car, PersonStanding } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getIslandFromDomain, ISLAND_CONFIG } from "@/lib/islandConfig";
import WelcomeTutorialModal from "@/components/tutorial/WelcomeTutorialModal";

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

  const island = getIslandFromDomain();
  const config = ISLAND_CONFIG[island] || ISLAND_CONFIG.Kauai;

  useEffect(() => {
    loadRides();
    base44.entities.PageView.create({ page_name: 'Welcome' }).catch(() => {});
    // Auto-open tutorial if URL has ?tutorial=true
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tutorial') === 'true') {
      setShowTutorial(true);
    }
  }, []);

  const loadRides = async (start = startDate, end = endDate) => {
    setIsLoadingRides(true);
    try {
      const allRides = await base44.entities.Ride.list("-departure_date");
      const filtered = allRides.filter(r =>
        r.status === 'active' &&
        r.departure_date >= start &&
        r.departure_date <= end
      );
      setRides(filtered);
    } catch (e) {
      console.error("Error loading rides:", e);
    }
    setIsLoadingRides(false);
  };

  const ridesByDate = rides.reduce((acc, ride) => {
    if (!acc[ride.departure_date]) acc[ride.departure_date] = [];
    acc[ride.departure_date].push(ride);
    return acc;
  }, {});

  const handleSignUp = () => {
    base44.auth.redirectToLogin(createPageUrl("Trips"));
  };

  const handleExplore = () => {
    navigate(createPageUrl("Trips") + "?explore=true");
  };

  const handleDriverSignup = () => {
    navigate(createPageUrl("DriverSignupFlow"));
  };

  const handleRiderSignup = () => {
    navigate(createPageUrl("RiderSignupFlow"));
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <style>{`
        [data-sidebar="trigger"] { display: none !important; }
      `}</style>

      {/* HERO */}
      <div className="relative bg-gradient-to-b from-green-900 via-green-800 to-green-700 text-white">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url('${config.heroImage}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative flex flex-col items-center justify-center px-6 py-14 text-center space-y-6">
          <img
            src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
            alt={`${config.appName} logo`}
            className="w-40 h-40 md:w-52 md:h-52 object-cover rounded-3xl shadow-2xl border-4 border-white/30"
          />
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg text-white">cruise kauaʻi</h1>
            <p className="mt-2 text-lg md:text-xl text-green-100 font-medium">Connect with neighbors, split the cost, and reduce traffic on the island we all love.</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* WE GET IT */}
        <div className="bg-green-900 text-white rounded-3xl p-6 shadow-lg">
          <h2 className="text-2xl font-extrabold uppercase tracking-wide mb-1 text-white">We get it...</h2>
          <h3 className="text-lg font-bold text-green-300 tracking-wider mb-4">Transportation is tough in hawaiʻi</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon: "⛽", label: "expensive gas" },
              { icon: "🚗", label: "loads of traffic" },
              { icon: "💸", label: "pricey car rentals" },
              { icon: "🔧", label: "shortage of mechanics" },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-green-800/60 rounded-2xl p-3 flex items-center gap-2 text-sm font-medium">
                <span className="text-xl">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-green-700 pt-4">
            <p className="text-base font-bold tracking-wide text-green-300 mb-1">Thatʻs why we launched {config.appName}</p>
            <p className="text-green-100 text-sm leading-relaxed">Our mission is to provide <strong className="text-white">accessible & affordable transportation options</strong>, and divert more money into our local economy.</p>
            <p className="text-green-200 text-sm leading-relaxed mt-3">We started on kauaʻi due to traffic, and we have expanded to serve all islands, but maintain our name cruise kauaʻi to pay homage to the foundation of our service 🌿</p>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div>
          <h2 className="text-2xl font-extrabold uppercase tracking-wide text-green-900 mb-4">how it works</h2>
          <div className="grid grid-cols-1 gap-4">
            {[
              { emoji: "🚗", role: "Drivers", color: "bg-blue-50 border-blue-200", titleColor: "text-blue-800", desc: "Offer rides on trips you're already taking & cover gas + vehicle maintenance costs." },
              { emoji: "🙋", role: "Riders", color: "bg-amber-50 border-amber-200", titleColor: "text-amber-800", desc: "Find affordable, reliable transportation around the island ($5–30/ride)." },
              { emoji: "🌿", role: "Simple!", color: "bg-green-50 border-green-200", titleColor: "text-green-800", desc: "Locals happy, visitors happy, & less cars on the road." },
            ].map(({ emoji, role, color, titleColor, desc }) => (
              <div key={role} className={`flex items-start gap-4 rounded-2xl border p-4 ${color}`}>
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm shrink-0">{emoji}</div>
                <div>
                  <p className={`font-bold text-base tracking-wide ${titleColor}`}>{role}</p>
                  <p className="text-gray-700 text-sm mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARPOOLING IS A CULTURAL SHIFT */}
        <div className="rounded-3xl overflow-hidden shadow" style={{background: "#f5f0eb", border: "1px solid #e8d5c4"}}>
          <div className="text-white px-6 py-4 text-center" style={{backgroundColor: "#b02a2a"}}>
            <h2 className="text-xl font-extrabold uppercase tracking-wide leading-tight text-white">Carpooling is a cultural shift</h2>
            <p className="text-red-200 text-sm font-medium mt-1">& we need everyone's help to make it a reality</p>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-red-900 font-bold text-sm uppercase tracking-wider text-center">get involved</p>
            {[
              { emoji: "🏡", title: "if you're local — register as a driver & start posting rides", desc: "Start making money on your commutes while improving transportation options on the island.", action: handleDriverSignup, actionLabel: "sign up as a driver 🚗" },
              { emoji: "🙋", title: "need a ride?", desc: "Get affordable rides from local drivers already heading your way — $5–$30 per ride.", action: handleRiderSignup, actionLabel: "sign up as a rider 🌺" },
              { emoji: "✈️", title: "if you're visiting — consider alternatives to car rentals", desc: config.visitingDesc },
              { emoji: "📣", title: "spread the word!", desc: `The more people use cruise kauaʻi, the more ride options there are and the less traffic there is. Share with family, friends & folks visiting` },
            ].map(({ emoji, title, desc, action, actionLabel }) => (
              <div key={title} className="flex gap-3 items-start bg-white rounded-2xl p-3 shadow-sm">
                <span className="text-2xl shrink-0">{emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm leading-snug">{title}</p>
                  <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{desc}</p>
                  {action && (
                    <Button onClick={action} size="sm" className="mt-2 bg-primary hover:bg-primary/90 text-white text-xs rounded-lg">
                      {actionLabel}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TRUST BADGES */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Shield className="w-5 h-5 text-green-700" />, label: "verified drivers" },
            { icon: <CheckCircle className="w-5 h-5 text-blue-600" />, label: "secure payments" },
            { icon: <Leaf className="w-5 h-5 text-green-600" />, label: "eco-friendly" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-3 text-center">
              {icon}
              <span className="text-xs text-gray-600 font-medium leading-tight">{label}</span>
            </div>
          ))}
        </div>



        {/* MAHALO */}
        <p className="text-center text-sm text-gray-500 italic">🤙 mahalo for being a part of the movement</p>

        {/* CTA BUTTONS */}
        <div className="space-y-3 pb-2">
          <Button
            onClick={handleSignUp}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-white py-5 text-base font-bold rounded-2xl shadow-md"
          >
            Join the Community
          </Button>
          <Button
            onClick={handleExplore}
            size="lg"
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-5 text-sm rounded-2xl"
          >
            Find a Ride Near You →
          </Button>
          <button
            onClick={() => setShowTutorial(true)}
            className="w-full text-center text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors py-1"
          >
            watch the welcome tutorial →
          </button>
        </div>

        <WelcomeTutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

        {/* VIEW RIDES TOGGLE */}
        <div>
          <button
            onClick={() => setShowRides(!showRides)}
            className="w-full text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            {showRides ? 'hide rides' : 'view all available rides →'}
          </button>
        </div>

        {showRides && (
          <div className="text-left space-y-4 pb-8">
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
                className="mb-0 h-9 px-3 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingRides ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingRides ? (
              <div className="text-center py-6 text-gray-400 text-sm">loading rides...</div>
            ) : Object.keys(ridesByDate).length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                no rides posted for this date range
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(ridesByDate)
                  .sort(([a], [b]) => new Date(a) - new Date(b))
                  .map(([date, dateRides]) => (
                    <div key={date}>
                      <p className="text-xs font-semibold text-secondary flex items-center gap-1 mb-2">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(date), 'MM/dd/yyyy')}
                      </p>
                      <div className="space-y-2">
                        {dateRides
                          .sort((a, b) => (a.departure_time || '').localeCompare(b.departure_time || ''))
                          .map(ride => (
                            <div key={ride.id} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                              <div className="flex justify-between items-start mb-1">
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className="font-semibold text-secondary text-sm">{ride.departure_time || 'Flexible'}</p>
                                  <p className="text-xs text-gray-600 truncate">{ride.departure_location} → {ride.destination}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-bold text-sm text-primary">${ride.price_per_seat_tourist || ride.price_per_seat || 0}</p>
                                  <p className="text-xs text-gray-500">/ seat</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={ride.driver_profile_picture_url} />
                                    <AvatarFallback className="bg-primary text-white text-xs">{(ride.driver_name || 'DR').split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">@{ride.driver_username || ride.driver_name}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Users className="w-3 h-3" />
                                  <span className="text-xs">{ride.seats_available} seats</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                <p className="text-xs text-center text-gray-400 pt-2">sign up to book a ride!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}