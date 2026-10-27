import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

const STEPS = [
  {
    emoji: "📱",
    title: "iPhone / iPad (Safari)",
    steps: [
      <>Tap the <Share2 className="w-4 h-4 inline mb-0.5" /> Share button at the bottom</>,
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top right',
      "Open the app from your home screen",
      "Tap 'Allow' when asked about notifications",
    ],
  },
  {
    emoji: "🤖",
    title: "Android (Chrome)",
    steps: [
      "Tap the menu (⋮) in the top right",
      '"Add to Home screen" → "Add"',
      "Open the app from your home screen",
      "Tap 'Allow' when asked about notifications",
    ],
  },
  {
    emoji: "💻",
    title: "Desktop (Edge / Chrome)",
    steps: [
      'Click the install icon in the address bar',
      'Click "Install"',
      "Open the installed app",
      "Allow notifications when prompted",
    ],
  },
];

export default function EnableNotificationsModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-2xl font-bold text-secondary">
            enable notifications 🔔
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            First, add Cruise Hawaiʻi to your home screen — then notifications will work.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {STEPS.map(({ emoji, title, steps }) => (
            <div key={title} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="font-semibold text-secondary mb-3">
                {emoji} {title}
              </p>
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 pt-4 border-t border-gray-100">
          <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90 rounded-2xl py-5 font-bold">
            got it →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}