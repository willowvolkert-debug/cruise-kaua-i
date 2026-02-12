import React from "react";
import { Button } from "@/components/ui/button";
import { Car, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Home() {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (isAuthenticated) {
        navigate(createPageUrl("Trips"));
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleSignUp = () => {
    base44.auth.redirectToLogin(createPageUrl("Trips"));
  };

  const handleExplore = () => {
    navigate(createPageUrl("Trips") + "?explore=true");
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Car className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-center text-secondary mb-6">
          Welcome to Cruise Kauaʻi!
        </h1>

        <p className="text-gray-600 text-lg leading-relaxed text-center mb-8">
          We are a community-based ridesharing app aimed at reducing traffic on Kauaʻi. Make money on your grocery runs or commutes by posting the ride you're already taking on the app. Riders can look at all rides on any date, or request a ride, paying a reasonable fare ($5-30) to get to their destination. Mahalo for being a part of the movement to reduce traffic & make transportation more accessible on Kauaʻi!
        </p>

        <div className="space-y-4">
          <Button
            onClick={handleSignUp}
            className="w-full py-6 text-lg bg-primary hover:bg-primary/90 rounded-2xl shadow-lg"
          >
            <Users className="w-5 h-5 mr-2" />
            Sign up Here!
          </Button>

          <Button
            onClick={handleExplore}
            variant="outline"
            className="w-full py-6 text-lg border-2 border-gray-300 hover:bg-gray-50 rounded-2xl"
          >
            Not ready to sign up? Explore the app here
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Join our growing community of drivers and riders on Kauaʻi
        </p>
      </div>
    </div>
  );
}