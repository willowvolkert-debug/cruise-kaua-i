import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Shield, Users, Leaf, CheckCircle, MapPin, Calendar, RefreshCw } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getIslandFromDomain, ISLAND_CONFIG } from "@/lib/islandConfig";
import WelcomeTutorialModal from "@/components/tutorial/WelcomeTutorialModal";

// Beautiful Hawaii highway/landscape photos from Unsplash (free to use)
const PHOTOS = {
  hero: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80", // Kauai beach panorama
  kauaiMountains: "https://images.unsplash.com/photo-1604999333679-b86d54738315?w=1200&q=80", // Kauai green mountains & coast
  jungleRoad: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1200&q=80", // Tropical jungle road
  napaliCoast: "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=1200&q=80", // Napali coast cliffs
  coastalRoad: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80", // Coastal cliffs road
  hanaleiValley: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=80", // Hawaii aerial valley
};

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
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tutorial') === 'true') setShowTutorial(true);
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

  const handleSignUp = () => base44.auth.redirectToLogin(createPageUrl("Trips"));
  const handleExplore = () => navigate(createPageUrl("Trips") + "?explore=true");
  const handleDriverSignup = () => navigate(createPageUrl("DriverSignupFlow"));
  const handleRiderSignup = () => navigate(createPageUrl("RiderSignupFlow"));

  const showPhonePromptLink = new Date() < new Date('2026-06-04');
  const loginTarget = showPhonePromptLink
    ? createPageUrl("Account") + "?show_phone_prompt=true"
    : createPageUrl("Account");

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">
      <style>{`
        [data-sidebar="trigger"] { display: none !important; }
        .welcome-section { padding: 80px 24px; }
        @media (max-width: 768px) { .welcome-section { padding: 56px 20px; } }
      `}</style>

      {/* LOGIN BANNER */}
      <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-center z-10 relative">
        <span className="text-sm text-gray-600">Welcome! </span>
        <button
          onClick={() => base44.auth.redirectToLogin(loginTarget)}
          className="text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
        >
          click here to log in →
        </button>
      </div>

      {/* ── HERO ── full-bleed photo with overlay text */}
      <div className="relative h-[90vh] min-h-[560px] flex flex-col items-center justify-center text-center overflow-hidden">
        <img
          src={PHOTOS.hero}
          alt="Hawaii coastline"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="relative z-10 px-6 max-w-2xl mx-auto space-y-6">
          <img
            src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
            alt={`${config.appName} logo`}
            className="w-28 h-28 md:w-36 md:h-36 object-cover rounded-2xl shadow-2xl border-2 border-white/40 mx-auto"
          />
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl leading-none">
            {config.appName}
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-medium leading-relaxed max-w-md mx-auto drop-shadow">
            Connect with neighbors, split the cost, and reduce traffic on the island we all love.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              onClick={handleSignUp}
              size="lg"
              className="bg-white text-green-900 hover:bg-white/90 font-bold px-8 py-4 text-base rounded-full shadow-xl"
            >
              Join the Community
            </Button>
            <Button
              onClick={handleExplore}
              size="lg"
              variant="outline"
              className="border-white/70 text-white hover:bg-white/10 font-medium px-8 py-4 text-base rounded-full"
            >
              Browse Rides →
            </Button>
          </div>
        </div>
        {/* scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-xs tracking-widest uppercase animate-bounce">
          scroll ↓
        </div>
      </div>

      {/* ── SECTION 1: The Problem — text left, photo right ── */}
      <section className="welcome-section bg-stone-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary">the reality</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              Transportation is tough<br />in Hawaiʻi.
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Expensive gas, heavy traffic, pricey car rentals, and a shortage of mechanics — getting around the island is a real challenge for locals and visitors alike.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { icon: "⛽", label: "Expensive gas" },
                { icon: "🚗", label: "Heavy traffic" },
                { icon: "💸", label: "Pricey car rentals" },
                { icon: "🔧", label: "Mechanic shortage" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                  <span className="text-xl">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
            <img
              src={PHOTOS.jungleRoad}
              alt="Kauai jungle road"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── FULL-BLEED PHOTO DIVIDER 1 ── */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img
          src={PHOTOS.kauaiMountains}
          alt="Kauai mountains and coastline"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <p className="text-white text-2xl md:text-4xl font-extrabold tracking-wide drop-shadow-lg text-center px-4 italic">
            "sharing aloha, one ride at a time"
          </p>
        </div>
      </div>

      {/* ── SECTION 2: Our Solution — photo left, text right ── */}
      <section className="welcome-section bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] order-2 md:order-1">
            <img
              src={PHOTOS.coastalRoad}
              alt="Hawaii coastal highway"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-6 order-1 md:order-2">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary">our solution</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              Thatʻs why we built<br />{config.appName}.
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Our mission is to provide <strong>accessible & affordable transportation</strong> across the islands, and divert more money back into our local economy.
            </p>
            <p className="text-gray-500 text-base leading-relaxed">
              We started on Kauaʻi to ease traffic, and have expanded to serve all islands — but keep our name to honor our roots. 🌿
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: How It Works ── centered, spacious */}
      <section className="welcome-section bg-green-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-green-400">simple by design</p>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">How it works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: "🚗", role: "Drivers", desc: "Offer rides on trips you're already taking. Cover your gas and vehicle costs while helping your neighbors." },
              { emoji: "🙋", role: "Riders", desc: "Find affordable rides from locals already heading your way. Just $5–$30 per ride." },
              { emoji: "🌿", role: "The Island", desc: "Less cars on the road. More money in local pockets. More aloha all around." },
            ].map(({ emoji, role, desc }) => (
              <div key={role} className="bg-white/10 backdrop-blur rounded-3xl p-8 space-y-4 text-left">
                <div className="text-5xl">{emoji}</div>
                <h3 className="text-2xl font-bold">{role}</h3>
                <p className="text-green-100 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL-BLEED PHOTO DIVIDER 2 ── */}
      <div className="relative h-64 md:h-[500px] overflow-hidden">
        <img
          src={PHOTOS.napaliCoast}
          alt="Napali Coast Kauai"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-end p-8 md:p-16">
          <p className="text-white text-xl md:text-3xl font-bold max-w-sm leading-snug drop-shadow-lg">
            The roads of Hawaiʻi are meant to be shared.
          </p>
        </div>
      </div>

      {/* ── SECTION 4: Get Involved ── */}
      <section className="welcome-section bg-stone-50">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-accent">join the movement</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">Get Involved</h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">Carpooling is a cultural shift — and we need everyone's help to make it a reality.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Driver card */}
            <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 space-y-4">
              <div className="text-4xl">🏡</div>
              <h3 className="text-xl font-bold text-gray-900">Are you local?</h3>
              <p className="text-gray-600 leading-relaxed">Register as a driver and start posting rides on your commutes. Earn money while improving life on the island.</p>
              <Button onClick={handleDriverSignup} className="bg-primary hover:bg-primary/90 text-white rounded-full px-6">
                Sign up as a driver 🚗
              </Button>
            </div>
            {/* Rider card */}
            <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 space-y-4">
              <div className="text-4xl">🙋</div>
              <h3 className="text-xl font-bold text-gray-900">Need a ride?</h3>
              <p className="text-gray-600 leading-relaxed">Get affordable rides from local drivers already heading your way. $5–$30 per ride, no car rental needed.</p>
              <Button onClick={handleRiderSignup} className="bg-secondary hover:bg-secondary/90 text-white rounded-full px-6">
                Sign up as a rider 🌺
              </Button>
            </div>
            {/* Visitor card */}
            <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 space-y-4">
              <div className="text-4xl">✈️</div>
              <h3 className="text-xl font-bold text-gray-900">Visiting the island?</h3>
              <p className="text-gray-600 leading-relaxed">{config.visitingDesc}</p>
            </div>
            {/* Spread the word */}
            <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 space-y-4">
              <div className="text-4xl">📣</div>
              <h3 className="text-xl font-bold text-gray-900">Spread the word!</h3>
              <p className="text-gray-600 leading-relaxed">The more people use Cruise Kauaʻi, the more rides are available and the less traffic there is. Share with friends, family, and visitors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FULL-BLEED PHOTO DIVIDER 3 ── */}
      <div className="relative h-48 md:h-72 overflow-hidden">
        <img
          src={PHOTOS.hanaleiValley}
          alt="Hanalei Valley aerial view"
          className="w-full h-full object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* ── TRUST BADGES ── */}
      <section className="welcome-section bg-white">
        <div className="max-w-3xl mx-auto space-y-10 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Built on trust</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: <Shield className="w-8 h-8 text-green-700 mx-auto" />, label: "Verified Drivers", sub: "License checks required" },
              { icon: <CheckCircle className="w-8 h-8 text-blue-600 mx-auto" />, label: "Secure Payments", sub: "Powered by Stripe" },
              { icon: <Leaf className="w-8 h-8 text-green-600 mx-auto" />, label: "Eco-Friendly", sub: "Fewer cars on the road" },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="space-y-2">
                {icon}
                <p className="font-bold text-gray-800 text-sm">{label}</p>
                <p className="text-gray-400 text-xs">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="welcome-section bg-green-900 text-white text-center">
        <div className="max-w-xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">Ready to ride?</h2>
          <p className="text-green-100 text-lg leading-relaxed">
            🤙 Mahalo for being a part of the movement. Every ride shared is a step toward a better Hawaiʻi.
          </p>
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleSignUp}
              size="lg"
              className="bg-white text-green-900 hover:bg-white/90 font-bold py-5 text-base rounded-full shadow-xl"
            >
              Join the Community
            </Button>
            <Button
              onClick={handleExplore}
              size="lg"
              variant="outline"
              className="border-white/50 text-white hover:bg-white/10 py-5 text-sm rounded-full"
            >
              Browse Rides Without Signing Up →
            </Button>
            <button
              onClick={() => setShowTutorial(true)}
              className="text-sm text-green-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              watch the welcome tutorial →
            </button>
          </div>
        </div>
      </section>

      {/* ── VIEW RIDES ── */}
      <section className="px-6 py-10 bg-stone-50">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <button
            onClick={() => setShowRides(!showRides)}
            className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            {showRides ? 'hide rides ↑' : 'view all available rides →'}
          </button>

          {showRides && (
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
                              <div key={ride.id} className="border border-gray-200 rounded-xl p-3 bg-white">
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
      </section>

      <WelcomeTutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}