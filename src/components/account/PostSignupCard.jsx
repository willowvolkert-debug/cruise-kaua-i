import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MapPin, UserCheck, ShieldAlert, PlayCircle, Users } from "lucide-react";
import ReferFriendDialog from "@/components/account/ReferFriendDialog";

export default function PostSignupCard({ user, onFinishProfile, onViewTutorial }) {
  const navigate = useNavigate();
  const [showRefer, setShowRefer] = React.useState(false);

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
      <div className="bg-card rounded-3xl shadow-2xl border-2 border-foreground/10 max-w-md w-full overflow-hidden my-4">
        {/* Header */}
        <div className="px-6 pt-10 pb-6 text-center text-white bg-primary">
          <div className="text-4xl mb-2">🎉</div>
          <h1 className="cruise-head text-4xl text-white">
            you're all set!
          </h1>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          <p className="text-foreground text-base leading-relaxed text-center">
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
            variant="outline"
            className="w-full border-border text-foreground hover:bg-muted rounded-full py-5 text-base font-bold"
          >
            <MapPin className="w-4 h-4 mr-2" />
            start browsing rides →
          </Button>
          <Button
            onClick={handleFinishProfile}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-5 text-base font-bold shadow-lg"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            finish my profile
          </Button>
          <Button
            onClick={onViewTutorial}
            variant="outline"
            className="w-full border-border text-foreground hover:bg-muted rounded-full py-5 text-base font-bold"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            view welcome tutorial
          </Button>
          <Button
            onClick={() => setShowRefer(true)}
            variant="outline"
            className="w-full border-border text-foreground hover:bg-muted rounded-full py-5 text-base font-bold"
          >
            <Users className="w-4 h-4 mr-2" />
            refer a friend
          </Button>
          <ReferFriendDialog open={showRefer} onClose={() => setShowRefer(false)} />
        </div>
      </div>
    </div>
  );
}