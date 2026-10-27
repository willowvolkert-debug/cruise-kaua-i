import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FindRideTutorial from "@/components/tutorial/FindRideTutorial";
import PostRideTutorial from "@/components/tutorial/PostRideTutorial";

// "?" button for the home page: opens the how-to info for getting and posting a ride.
export default function HomeHelpButton() {
  const [open, setOpen] = useState(null); // "menu" | "find" | "post" | null
  const close = () => setOpen(null);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen("menu")}
        aria-label="Help"
        className="inline-flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-300 text-secondary hover:bg-gray-50 select-none"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      <Dialog open={open === "menu"} onOpenChange={close}>
        <DialogContent className="sm:max-w-sm bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="cruise-head tracking-widest text-2xl text-secondary">need help?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <button type="button" onClick={() => setOpen("find")} className="w-full h-14 rounded-lg bg-primary text-white font-bold text-lg select-none">
              how to get a ride 🔍
            </button>
            <button type="button" onClick={() => setOpen("post")} className="w-full h-14 rounded-lg bg-primary text-white font-bold text-lg select-none">
              how to post a ride 🚗
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <FindRideTutorial isOpen={open === "find"} onClose={close} />
      <PostRideTutorial isOpen={open === "post"} onClose={close} />
    </>
  );
}