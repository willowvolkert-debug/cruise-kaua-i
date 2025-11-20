import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, User, MessageSquare } from "lucide-react";

export default function FindRideTutorial({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            how to find a ride
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-secondary mb-1">search for rides</h4>
              <p className="text-sm text-gray-600">
                Enter where you're leaving from, where you're going, and your travel date. Select how many seats you need.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-secondary mb-1">view available rides</h4>
              <p className="text-sm text-gray-600">
                Browse rides organized by date and time. See route details, available seats, and pricing at a glance.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-secondary mb-1">check driver profiles</h4>
              <p className="text-sm text-gray-600">
                Click "view driver" to see their profile, ratings, reviews, and vehicle details before requesting a ride.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-secondary mb-1">book & coordinate</h4>
              <p className="text-sm text-gray-600">
                Request seats and payment processes when the driver accepts. Then chat in the Inbox to coordinate pickup location and time.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Add a description when booking to let the driver know why you need the ride and if you have luggage!
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