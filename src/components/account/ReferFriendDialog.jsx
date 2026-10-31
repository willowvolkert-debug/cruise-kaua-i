import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, MessageSquare, Mail, Share2 } from "lucide-react";

export default function ReferFriendDialog({ open, onClose }) {
  const [copied, setCopied] = useState(false);
  const link = "cruisehi.org";
  const message = `Aloha! I've been using Cruise, a community ridesharing app for the islands. You can save money, skip traffic, and meet neighbors. Sign up here: ${link}`;
  const enc = encodeURIComponent(message);

  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = () => navigator.share({ title: "Cruise", text: message });

  const options = [
    { label: "text message", icon: MessageSquare, href: `sms:?&body=${enc}` },
    { label: "whatsapp", icon: MessageSquare, href: `https://wa.me/?text=${enc}` },
    { label: "email", icon: Mail, href: `mailto:?subject=${encodeURIComponent("Join me on Cruise")}&body=${enc}` },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="cruise-head text-3xl text-secondary">refer a friend</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-foreground bg-muted rounded-2xl p-4 leading-relaxed select-text">{message}</p>
        <div className="space-y-2">
          <Button onClick={copy} className="w-full rounded-full py-5 font-bold">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "copied!" : "copy message"}
          </Button>
          {options.map(({ label, icon: Icon, href }) => (
            <Button key={label} asChild variant="outline" className="w-full rounded-full py-5 font-bold">
              <a href={href} target="_blank" rel="noreferrer"><Icon className="w-4 h-4 mr-2" />{label}</a>
            </Button>
          ))}
          {navigator.share && (
            <Button onClick={share} variant="outline" className="w-full rounded-full py-5 font-bold">
              <Share2 className="w-4 h-4 mr-2" /> more options
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}