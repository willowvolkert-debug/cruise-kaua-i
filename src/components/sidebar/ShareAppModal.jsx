import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Ship, MessageCircle, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ShareAppModal({ isOpen, onClose, currentUser }) {
  const handleShare = async (platform) => {
    const shareText = "Check out Cruise Kauaʻi - the island's ride-sharing app! 🚗🌺";
    const shareUrl = window.location.origin;
    
    let url = '';
    switch(platform) {
      case 'sms':
        url = `sms:?body=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't have direct share URL, copy to clipboard instead
        navigator.clipboard.writeText(shareText + ' ' + shareUrl);
        alert("Link copied! Share it on Instagram!");
        return;
    }
    
    if (url) {
      window.open(url, '_blank');
      
      // Increment shares_completed
      const newSharesCount = (currentUser.shares_completed || 0) + 1;
      let updateData = { shares_completed: newSharesCount };
      
      // If user completed 3 shares, add $20 coupon
      if (newSharesCount % 3 === 0) {
        const newBalance = (currentUser.coupon_balance || 0) + 20;
        updateData.coupon_balance = newBalance;
        alert("Congrats! You've earned a $20 carpool coupon! 🎉");
      }
      
      await base44.auth.updateMe(updateData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-blue-500 text-white border-0 rounded-3xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-90 transition-opacity hover:opacity-100"
        >
          <X className="h-6 w-6 text-black" />
        </button>

        <div className="text-center space-y-6 py-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <Ship className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">want to share cruise kauaʻi?</h2>
            <p className="text-blue-100">
              share with 3 friends and get a carpool coupon on us!
            </p>
            {currentUser && currentUser.shares_completed > 0 && (
              <p className="text-sm text-blue-200 mt-2">
                {currentUser.shares_completed % 3}/3 shares completed
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleShare('sms')}
              className="bg-white text-blue-500 hover:bg-blue-50 py-6 rounded-2xl"
            >
              <MessageCircle className="w-6 h-6 mr-2" />
              iMessage
            </Button>
            <Button
              onClick={() => handleShare('whatsapp')}
              className="bg-white text-green-600 hover:bg-blue-50 py-6 rounded-2xl"
            >
              <MessageCircle className="w-6 h-6 mr-2" />
              WhatsApp
            </Button>
            <Button
              onClick={() => handleShare('instagram')}
              className="bg-white text-pink-600 hover:bg-blue-50 py-6 rounded-2xl"
            >
              <Share2 className="w-6 h-6 mr-2" />
              Instagram
            </Button>
            <Button
              onClick={() => handleShare('facebook')}
              className="bg-white text-blue-600 hover:bg-blue-50 py-6 rounded-2xl"
            >
              <Share2 className="w-6 h-6 mr-2" />
              Facebook
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}