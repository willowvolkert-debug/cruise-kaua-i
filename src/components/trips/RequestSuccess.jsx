import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// "Request submitted" panel (offers a return ride) + thank-you dialog.
export default function RequestSuccess({ postedRequest, showModal, setShowModal, currentUser, onReturn, onDismiss }) {
  return (
    <>
      {postedRequest && (
        <div className="rounded-lg border-2 border-green-300 bg-green-50 p-6 space-y-4">
          <div>
            <p className="font-bold text-green-800 text-2xl">request submitted! 🎉</p>
            <p className="text-lg text-green-700">{postedRequest.departure_location} → {postedRequest.destination}</p>
          </div>
          <p className="text-lg text-green-800 font-medium">want to also request a return ride?</p>
          <p className="text-base text-green-700">
            <a href="/inbox" className="font-semibold underline underline-offset-2 hover:text-green-900">edit a pre-existing ride request here →</a>
          </p>
          <div className="flex gap-3">
            <Button type="button" className="flex-1 h-14 text-lg bg-green-600 hover:bg-green-700 rounded-lg" onClick={onReturn}>
              yes, pre-fill return request
            </Button>
            <Button type="button" variant="outline" className="flex-1 h-14 text-lg rounded-lg border-2 border-green-400 text-green-700" onClick={onDismiss}>
              no thanks
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl text-secondary">thanks!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-lg">
            <p className="text-gray-600">
              your requested ride will be shown to drivers posting rides, where they will be able to message you to book their trip.
            </p>
            <p className="text-gray-600">we will also message you if we find a ride that matches your request.</p>
            {!currentUser?.drivers_license_verified && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-base text-amber-800">
                  🪪 before you can ride, you'll need to upload your driver's license.{" "}
                  <a href="/account" className="font-semibold underline underline-offset-2">go to your account to upload it →</a>
                </p>
              </div>
            )}
            <Button onClick={() => setShowModal(false)} className="w-full h-14 text-lg bg-primary hover:bg-primary/90 rounded-lg">
              got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}