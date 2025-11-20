import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Chrome, Share2 } from "lucide-react";

export default function EnableNotificationsModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-primary" />
            enable notifications
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-gray-700">
            To receive notifications, you need to add Cruise Kauaʻi to your device's home screen first.
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Chrome className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-secondary">Safari (iPhone/iPad)</h4>
              </div>
              <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
                <li>Tap the <Share2 className="w-4 h-4 inline" /> Share button at the bottom of your screen</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right corner</li>
                <li>Find the Cruise Kauaʻi icon on your home screen</li>
                <li>Open the app and enable notifications</li>
              </ol>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Chrome className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-secondary">Chrome (Android)</h4>
              </div>
              <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
                <li>Tap the menu (three dots) in the top right</li>
                <li>Tap "Add to Home screen"</li>
                <li>Tap "Add" to confirm</li>
                <li>Find the Cruise Kauaʻi icon on your home screen</li>
                <li>Open the app and enable notifications</li>
              </ol>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Chrome className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-secondary">Edge (Desktop)</h4>
              </div>
              <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
                <li>Click the "App available" icon in the address bar</li>
                <li>Click "Install" to add to your taskbar</li>
                <li>Open the installed app</li>
                <li>Enable notifications when prompted</li>
              </ol>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
          >
            got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}