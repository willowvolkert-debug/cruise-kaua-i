import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Car, MapPin, Clock, DollarSign, Users } from "lucide-react";

export default function PostRideTutorial({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary flex items-center gap-2">
            <Car className="w-6 h-6 text-primary" />
            how to post a ride
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-secondary mb-1">route details</h4>
              <p className="text-sm text-gray-600">
                Enter where you're leaving from and where you're heading. Add optional stops along the way.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-secondary mb-1">schedule</h4>
              <p className="text-sm text-gray-600">
                Pick your departure date and time. Toggle "flexible" if your timing can vary, or mark as "last minute" for urgent rides.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-secondary mb-1">pricing & vehicle</h4>
              <p className="text-sm text-gray-600">
                Set your price per seat. Choose different prices for locals and tourists if you prefer. Your verified vehicle info will auto-fill.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-secondary mb-1">rider preferences</h4>
              <p className="text-sm text-gray-600">
                Choose who can ride with you: locals only, tourists only, or both. When riders request, you'll review their profile before accepting.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Add a trip description explaining why you're making this drive. It helps riders understand your plans!
            </p>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 rounded-2xl mt-4"
          >
            got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}