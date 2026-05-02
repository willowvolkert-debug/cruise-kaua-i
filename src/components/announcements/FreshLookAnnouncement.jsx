import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Share } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FreshLookAnnouncement({ isOpen, onClose }) {
  const handleDismiss = async () => {
    await base44.auth.updateMe({ has_seen_fresh_look_2025: true });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-sm bg-white rounded-3xl border-0 shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-800 to-green-600 text-white px-6 pt-6 pb-5 text-center">
          <img
            src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
            alt="Cruise Kauaʻi"
            className="w-16 h-16 object-cover rounded-2xl mx-auto mb-3 shadow-lg border-2 border-white/30"
          />
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <h2 className="text-lg font-extrabold tracking-wide text-white">cruise kauaʻi just got a refresh</h2>
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-gray-700 text-sm text-center leading-relaxed">
            We've updated the app with a cleaner design inspired by the spirit of kauaʻi. Same great rides — better experience!
          </p>

          {/* Home screen reminder */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
            <p className="font-bold text-blue-800 text-sm flex items-center gap-2">
              <Share className="w-4 h-4" /> add this website to your home screen as an app
            </p>
            <div className="text-xs text-blue-700 space-y-1.5">
              <div className="flex gap-2 items-start">
                <span className="shrink-0">🍎</span>
                <p><strong>iPhone:</strong> tap the <strong>Share ⬆️</strong> icon in Safari → <strong>"Add to Home Screen"</strong></p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="shrink-0">🤖</span>
                <p><strong>Android:</strong> tap the <strong>three-dot menu ⋮</strong> in Chrome → <strong>"Add to Home screen"</strong></p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-gray-400 italic">🤙 mahalo for riding with us</p>

          <Button
            onClick={handleDismiss}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl py-5 text-sm font-bold"
          >
            got it, let's go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}