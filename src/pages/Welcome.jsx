import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Leaf, CheckCircle, MapPin, Calendar, Star, RefreshCw } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

  useEffect(() => {
    loadRides();
    // Track landing page view
    base44.entities.PageView.create({ page_name: 'Welcome' }).catch(() => {});
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4 overflow-x-hidden">
      <style>{`
        [data-sidebar="trigger"] {
          display: none !important;
        }
      `}</style>
      <Card className="max-w-2xl w-full shadow-2xl border-gray-200 rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-5 md:p-10 text-center space-y-6 w-full min-w-0">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary">Welcome to Cruise Kauaʻi!</h1>
          </div>

          {/* We get it section */}
          <div className="bg-green-50 rounded-2xl p-5 text-left space-y-3">
            <h2 className="font-bold text-green-800 text-lg">we get it... transportation is tough on kauaʻi</h2>
            <ul className="space-y-1 text-gray-700 text-sm">
              {["expensive gas", "loads of traffic", "pricey car rentals", "a shortage of affordable mechanics"].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-gray-700 text-sm font-medium">
              That's why we launched Cruise Kauaʻi — our mission is to provide <strong>accessible & affordable transportation options</strong> and divert more money into our local economy.
            </p>
          </div>

          {/* How it works */}
          <div className="text-left space-y-3 w-full min-w-0">
            <h2 className="font-bold text-secondary text-lg">how it works</h2>
            <div className="space-y-3">
              {[
                { emoji: "🚗", title: "drivers", desc: "Offer rides on the trips they're already taking & cover gas + vehicle maintenance costs." },
                { emoji: "🙋", title: "riders", desc: "Find affordable, reliable transportation around the island ($5–30/ride)." },
                { emoji: "🌿", title: "simple", desc: "Locals happy, visitors happy, & less cars on the road." },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">{emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{title}</p>
                    <p className="text-gray-600 text-sm break-words">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carpooling is a cultural shift */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left space-y-3 w-full min-w-0">
            <h2 className="font-bold text-orange-800 text-sm leading-snug">carpooling is a cultural shift & we need everyone's help to make it a reality</h2>
            <div className="space-y-3">
              {[
                { emoji: "🏡", title: "if you're local — register as a driver & start posting rides", desc: "Start making money on your commutes while improving transportation options on the island." },
                { emoji: "✈️", title: "if you're visiting — consider alternatives to car rentals", desc: "Get around with Cruise Kauaʻi & The Hanalei Initiative Shuttles in Kapaʻa, Princeville, Hanalei & Hāʻena." },
                { emoji: "📣", title: "spread the word!", desc: "The more people use Cruise Kauaʻi, the more ride options there are. Share with family, friends & folks visiting!" },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex gap-2 items-start">
                  <span className="shrink-0 text-base">{emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm break-words">{title}</p>
                    <p className="text-gray-600 text-sm break-words">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500 italic text-center">🤙 mahalo for being a part of the movement</p>

          <div className="space-y-3">
            <Button 
              onClick={handleSignUp}
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-5 text-base md:text-lg rounded-2xl font-semibold"
            >
              sign up here!
            </Button>
            
            <Button 
              onClick={handleExplore}
              size="lg"
              variant="outline"
              className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-5 text-base md:text-lg rounded-2xl"
            >
              not ready to sign up? explore the app here.
            </Button>
          </div>

          <div className="pt-6 space-y-3">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>verified drivers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-600" />
                <span>eco-friendly</span>
              </div>
            </div>
          </div>

          {/* View All Rides Toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowRides(!showRides)}
              className="w-full text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
            >
              {showRides ? 'hide rides' : 'view all rides →'}
            </button>
          </div>

          {showRides && (
            <div className="text-left space-y-4 pt-2">
              {/* Date filter */}
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
        </CardContent>
      </Card>
    </div>
  );
}