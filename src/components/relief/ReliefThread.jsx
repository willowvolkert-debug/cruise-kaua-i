import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ReliefThread({ post, user, otherId, otherName, onClose }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");

  const load = async () => {
    const res = await base44.entities.ReliefMessage.filter({ post_id: post.id }, { sort: "created_date", limit: 200 });
    setMsgs(res.items.filter((m) => m.sender_id === otherId || m.recipient_id === otherId));
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!text.trim()) return;
    await base44.entities.ReliefMessage.create({
      post_id: post.id,
      post_title: post.title,
      sender_id: user.id,
      sender_name: user.full_name || user.username || "Cruise member",
      recipient_id: otherId,
      message: text.trim(),
    });
    setText("");
    load();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>message {otherName}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">re: {post.title}</p>
        <div className="h-60 overflow-y-auto space-y-2 bg-muted/40 rounded-xl p-2">
          {msgs.length === 0 && <p className="text-sm text-muted-foreground text-center mt-8">say hello</p>}
          {msgs.map((m) => (
            <div key={m.id} className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.sender_id === user.id ? "ml-auto bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
              {m.message}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="type a message" />
          <Button onClick={send} className="bg-green-600 hover:bg-green-700 text-white">send</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}