import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MapPin, UserCheck, ShieldAlert } from "lucide-react";

export default function PostSignupCard({ user, onFinishProfile }) {
  const navigate = useNavigate();

  const handleBrowseRides = async () => {
    try {
      await base44.auth.updateMe({ has_seen_post_signup_card: true });
    } catch (e) { /* non-critical */ }
    navigate("/trips");
  };

  const handleFinishProfile = async () => {
    try {
      await base44.auth.updateMe({ has_seen_post_signup_card: true });
    } catch (e) { /* non-critical */ }
    onFinishProfile();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden my-4">
        {/* Header */}
        <div
          className="px-6 pt-10 pb-6 text-center text-white"
          style={{ background: "linear-gradient(135deg, #1a4a2e 0%, #2d6a4f 100%)" }}
        >
          <div className="text-4xl mb-2">🎉</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            you're all set!
          </h1>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          <p className="text-gray-700 text-base leading-relaxed text-center">
            Great! That's all we need for now. If you're in a rush for a ride, go
            ahead and start booking. If not, finish your profile here.
          </p>

          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-2xl">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>P.S:</strong> You will need to finish your profile &amp; upload
              your license before you can get in the car with anyone.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 space-y-3">
          <Button
            onClick={handleBrowseRides}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-5 text-base font-bold shadow-lg"
          >
            <MapPin className="w-4 h-4 mr-2" />
            start browsing rides →
          </Button>
          <Button
            onClick={handleFinishProfile}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full py-5 text-base font-bold"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            finish my profile
          </Button>
        </div>
      </div>
    </div>
  );
}