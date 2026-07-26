import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, MapPin, Calendar, RefreshCw, Shield, Leaf } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getIslandFromDomain, ISLAND_CONFIG } from "@/lib/islandConfig";
import WelcomeTutorialModal from "@/components/tutorial/WelcomeTutorialModal";
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

  const island = getIslandFromDomain();
  const config = ISLAND_CONFIG[island] || ISLAND_CONFIG.Kauai;

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
  const handleExplore = () => navigate(createPageUrl("Trips") + "?explore=true");
  const handleDriverSignup = () => navigate("/join");
  const handleRiderSignup = () => navigate("/join");

  const showPhonePromptLink = new Date() < new Date('2026-06-04');
  const loginTarget = showPhonePromptLink ?
  createPageUrl("Account") + "?show_phone_prompt=true" :
  createPageUrl("Account");

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">

      {/* ── HERO ── Nā Pali photo background with dark green overlay */}
      <div
        className="relative z-0 flex flex-col items-center justify-center text-center px-6 py-16"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=1200&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
        
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(26, 74, 46, 0.72)' }} />

        {/* Login button top-right */}
        <button
          onClick={() => navigate(`/join?next=${encodeURIComponent('/trips')}&login=true`)}
          className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-full border border-white/40 backdrop-blur-sm transition-colors">
          log in →
        </button>

        <img
          src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
          alt={`${config.appName} logo`}
          className="relative z-10 w-32 h-32 md:w-40 md:h-40 object-cover rounded-3xl shadow-2xl border-2 border-white/20 mb-6" />
        
        <h1 className="relative z-10 text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-1 leading-tight">
          {config.appName}
        </h1>
        {config.islandSubtitle && (
          <p className="relative z-10 text-xl md:text-2xl font-semibold text-white/70 mb-2 tracking-wide">
            {config.islandSubtitle}
          </p>
        )}
        <p className="relative z-10 text-base md:text-lg text-white/80 font-medium leading-relaxed max-w-xs mx-auto mb-2">
          {config.heroSubtitle || "a community carpooling service in hawaiʻi"}
        </p>
        {config.recruitingDrivers &&
        <button
          onClick={handleDriverSignup}
          className="relative z-10 inline-flex items-center gap-2 bg-amber-400 text-amber-900 font-bold px-5 py-2 rounded-full text-sm shadow-lg animate-pulse mt-3 hover:bg-amber-300 transition-colors cursor-pointer">
          
            🚗 Now Recruiting Drivers on Oʻahu!
          </button>
        }
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center mt-6 w-full max-w-xs mx-auto">
          <Button
            onClick={handleSignUp}
            size="lg"
            className="bg-white text-green-900 hover:bg-white/90 font-bold px-8 rounded-full shadow-xl">
            
            Join the Community
          </Button>
          <Button
            onClick={handleExplore}
            size="lg"
            className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-medium px-8 rounded-full">
            
            Browse Rides →
          </Button>
        </div>
      </div>

      {/* ── WE GET IT section ── dark green card */}
      <div className="px-4 py-6 bg-white">
        <div
          className="max-w-2xl mx-auto rounded-3xl p-6 md:p-8 my-1 opacity-100"
          style={{ background: 'linear-gradient(135deg, rgba(26,74,46,0.85) 0%, rgba(45,106,79,0.85) 100%)' }}>
          
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">WE GET IT...</p>
          <h2 className="text-xl md:text-2xl font-extrabold text-white mb-4">
            Getting around in Hawaiʻi is harder than it should be
          </h2>
          {/* Icons first */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
            { emoji: "⛽", label: "expensive gas" },
            { emoji: "🚗", label: "loads of traffic" },
            { emoji: "💸", label: "pricey car rentals" },
            { emoji: "🔧", label: "mechanic shortage" }].
            map(({ emoji, label }) =>
            <div key={label} className="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-3">
                <span className="text-xl">{emoji}</span>
                <span className="text-white text-sm font-medium">{label}</span>
              </div>
            )}
          </div>
          {/* Body text below */}
          <p className="text-white/70 text-sm leading-relaxed">
            Hawaiʻi is being loved to death, and its people are being hurt in the process — stuck in traffic for hours and paying too much in transportation costs.
          </p>
        </div>
      </div>

      {/* ── OUR SOLUTION ── */}
      <section className="px-4 py-8 bg-white">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary">our solution</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
            That's why we built<br />{config.appName}.
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Our mission is to provide <strong>accessible & affordable transportation</strong> across the islands, and divert more money back into our local economy.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            We started on Kauaʻi with a simple mission to ease traffic, and have expanded into a holistic example of how we can support local, reduce traffic, and build community all at the same time!
          </p>

          {/* ── HOW IT WORKS (inline) ── */}
          <div className="mt-6 rounded-3xl overflow-hidden opacity-85" style={{ background: 'linear-gradient(135deg, #1a4a2e 0%, #2d6a4f 100%)' }}>
            <div className="p-6 space-y-5 opacity-100 mx-1">
              
              {/* Driver + Rider cards side by side */}
              <div className="flex items-stretch gap-3">
                <div className="flex-1 bg-white/10 rounded-2xl p-4 space-y-2 text-center">
                  <div className="text-3xl">🚗</div>
                  <h3 className="text-base font-bold text-white">Drivers</h3>
                  <p className="text-green-100 text-xs leading-relaxed">Offer rides on trips you're already taking. Cover your gas while helping neighbors.</p>
                </div>
                <div className="flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-green-300">+</span>
                </div>
                <div className="flex-1 bg-white/10 rounded-2xl p-4 space-y-2 text-center">
                  <div className="text-3xl">🙋</div>
                  <h3 className="text-base font-bold text-white">Riders</h3>
                  <p className="text-green-100 text-xs leading-relaxed">Find affordable rides from locals heading your way. Just $5–$30 per ride.</p>
                </div>
              </div>
              {/* Arrow + Simple */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-green-400 text-2xl leading-none">↓</span>
                <h3 className="text-2xl font-extrabold text-white">Simple!</h3>
                <p className="text-green-100 text-sm text-center">Less cars on the road & more money in localsʻ pockets.</p>
              </div>
            </div>
          </div>


          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => navigate("/join")}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-5 text-base font-bold shadow-lg">
              
              sign up here →
            </Button>
          </div>
        </div>
      </section>

      {/* ── OAHU: A NEW OPTION FOR TRANSPORTATION ── */}
      {config.showTransportOptions &&
      <section className="px-4 py-10" style={{ background: 'linear-gradient(135deg, #0f2a4a 0%, #1a3d6b 100%)' }}>
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">a new option for transportation</h2>
            </div>

            {/* Existing options */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-4 bg-white/10 rounded-2xl p-4">
                <span className="text-3xl shrink-0">🚌</span>
                <p className="text-white/80 text-sm leading-relaxed"><span className="font-bold text-white">Bus —</span> best for short distances within a town. Takes a long time when going long distances + noisy.</p>
              </div>
              <div className="flex items-start gap-4 bg-white/10 rounded-2xl p-4">
                <span className="text-3xl shrink-0">🚗</span>
                <p className="text-white/80 text-sm leading-relaxed"><span className="font-bold text-white">Hui Car Share —</span> best for families trying to get around Honolulu and/or short rides through the city.</p>
              </div>
              <div className="flex items-start gap-4 bg-white/10 rounded-2xl p-4">
                <span className="text-3xl shrink-0">🚕</span>
                <p className="text-white/80 text-sm leading-relaxed"><span className="font-bold text-white">Uber/taxi —</span> good for short distances, but a strain on our wallets.</p>
              </div>
            </div>

            {/* Cruise Oahu highlight */}
            <div className="bg-white/15 border border-white/30 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🌿</span>
                <div>
                  <span className="inline-block bg-amber-400 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full">NEW!</span>
                </div>
              </div>
              <p className="text-white text-sm leading-relaxed">
                <span className="font-bold">Cruise Oʻahu</span> is a new option to complement the services Oʻahu already has. Itʻs best for mid-long distances between sides of the island, when a local driver is already commuting.
              </p>
              <p className="text-white/80 text-sm leading-relaxed">
                Whether itʻs to north shore for surf, or getting back to town, our service allows local drivers to cover their gas, use the carpool lane, and meet new people.
              </p>
              <p className="text-white/80 text-sm leading-relaxed">
                Itʻs a useful option for those without a car, or a quick way to get to & from one spot without the hassle of traffic & finding parking.
              </p>
            </div>
          </div>
        </section>
      }

      {/* ── PHOTO BREAK 2: Haʻena Beach aerial ── */}
      <div className="w-full h-56 md:h-72 overflow-hidden">
        <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/e91321132_IMG_6433FEBB2F35-1.jpeg"

        alt="Aerial view of Haʻena beach"
        className="w-full h-full object-cover" />
        
      </div>

      {/* ── GET INVOLVED ── */}
      <section className="px-4 py-8 bg-white">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-accent">join the movement</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Get Involved</h2>
            <p className="text-gray-600 text-sm max-w-md mx-auto">Hawaiʻi roads should be shared, but carpooling is a cultural shift. We need everyoneʻs help to make it a reality.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`rounded-3xl p-6 shadow-md border space-y-3 ${config.recruitingDrivers ? 'border-amber-300 ring-2 ring-amber-200 bg-white' : 'bg-white border-gray-100'}`}>
              <div className="text-3xl">🏡</div>
              <h3 className="text-lg font-bold text-gray-900">{config.driverCardTitle || "Are you local?"}</h3>
              {config.recruitingDrivers &&
              <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">🚗 Now Recruiting!</span>
              }
              <p className="text-gray-600 text-sm leading-relaxed">{config.driverCardDesc || "Register as a driver and start posting rides on your commutes. Earn money while improving life on the island."}</p>
              <Button onClick={handleDriverSignup} className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 text-sm">
                Sign up as a driver 🚗
              </Button>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-3">
              <div className="text-3xl">🙋</div>
              <h3 className="text-lg font-bold text-gray-900">Need a ride?</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{config.riderCardDesc || "Get affordable rides from local drivers already heading your way. $5–$30 per ride, no car rental needed."}</p>
              <Button onClick={handleRiderSignup} className="bg-secondary hover:bg-secondary/90 text-white rounded-full px-6 text-sm">
                Sign up as a rider 🌺
              </Button>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-3">
              <div className="text-3xl">✈️</div>
              <h3 className="text-lg font-bold text-gray-900">Visiting the island?</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{config.visitingDesc}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-3">
              <div className="text-3xl">📣</div>
              <h3 className="text-lg font-bold text-gray-900">Spread the word!</h3>
              <p className="text-gray-600 text-sm leading-relaxed">The more people use Cruise Kauaʻi, the more rides are available and the less traffic there is. Share with friends, family, and visitors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="px-4 py-8 bg-stone-50">
        <div className="max-w-2xl mx-auto space-y-6 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900">Built on trust</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
            { icon: <Shield className="w-7 h-7 text-green-700 mx-auto" />, label: "Verified Drivers", sub: "License checks required" },
            { icon: <CheckCircle className="w-7 h-7 text-blue-600 mx-auto" />, label: "Secure Payments", sub: "Powered by Stripe" },
            { icon: <Leaf className="w-7 h-7 text-green-600 mx-auto" />, label: "ʻĀina-Oriented", sub: "Fewer cars on the road" }].
            map(({ icon, label, sub }) =>
            <div key={label} className="space-y-1">
                {icon}
                <p className="font-bold text-gray-800 text-xs">{label}</p>
                <p className="text-gray-400 text-xs">{sub}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-0 px-4 py-16 text-center overflow-hidden" style={{ backgroundImage: 'url(https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/65702faf8_IMG_D222AF74070A-1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 max-w-sm mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl px-6 py-8 space-y-6 opacity-70">
            <h2 className="text-3xl font-extrabold leading-tight text-gray-900">Ready to ride?</h2>
            <p className="text-gray-700 text-base leading-relaxed">
              🤙 Mahalo for being a part of the movement. Every ride shared is a step toward a better Hawaiʻi.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSignUp}
                size="lg"
                className="bg-black text-white hover:bg-black/85 font-bold rounded-full shadow-xl">
                Join the Community
              </Button>
              <Button
                onClick={handleExplore}
                size="lg"
                className="bg-black text-white hover:bg-black/85 rounded-full text-sm">
                Browse Rides Without Signing Up →
              </Button>
              <button
                onClick={() => setShowTutorial(true)}
                className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors">
                watch the welcome tutorial →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIEW RIDES ── */}
      <section className="px-4 py-8 bg-stone-50">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <button
            onClick={() => setShowRides(!showRides)}
            className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
            
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
                className="mb-0 h-9 px-3 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 shrink-0">
                
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
                        <p className="text-xs font-semibold text-secondary flex items-center gap-1 mb-2">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(date), 'MM/dd/yyyy')}
                        </p>
                        <div className="space-y-2">
                          {dateRides.
                  sort((a, b) => (a.departure_time || '').localeCompare(b.departure_time || '')).
                  map((ride) =>
                  <div key={ride.id} className="border border-gray-200 rounded-2xl p-4 bg-white space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-extrabold text-gray-900 text-base leading-tight truncate">
                                    {ride.departure_location} → {ride.destination}
                                  </p>
                                  <p className="font-bold text-lg text-primary shrink-0">${ride.price_per_seat_tourist || ride.price_per_seat || 0}<span className="text-xs font-normal text-gray-400">/seat</span></p>
                                </div>
                                <p className="text-sm text-secondary font-medium">{ride.departure_time || 'Flexible time'}</p>
                                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={ride.driver_profile_picture_url} />
                                      <AvatarFallback className="bg-primary text-white text-xs">{(ride.driver_name || 'DR').split(' ').map((n) => n[0]).join('').toUpperCase()}</AvatarFallback>
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
                  className="text-sm font-semibold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
                  
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
      <footer className="bg-gray-900 text-gray-400 px-6 py-8 text-center space-y-3">
        <p className="text-white font-bold text-base">cruise hawaiʻi</p>
        <p className="text-sm">sharing aloha one ride at a time</p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm pt-1">
          <a href="/termsofservice" className="hover:text-white underline underline-offset-2 transition-colors">Terms of Service</a>
          <span className="text-gray-600">·</span>
          <a href="/privacypolicy" className="hover:text-white underline underline-offset-2 transition-colors">Privacy Policy</a>
          <span className="text-gray-600">·</span>
          <a href="/sms-opt-in" className="hover:text-white underline underline-offset-2 transition-colors">SMS Notifications</a>
          <span className="text-gray-600">·</span>
          <a href="mailto:cruisekauai@gmail.com" className="hover:text-white underline underline-offset-2 transition-colors">cruisekauai@gmail.com</a>
        </div>
        <p className="text-xs text-gray-600 pt-2">© {new Date().getFullYear()} Cruise Kauaʻi. All rights reserved.</p>
      </footer>
    </div>);

}