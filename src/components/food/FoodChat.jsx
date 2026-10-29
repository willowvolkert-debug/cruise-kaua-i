import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function FoodChat({ request, user, onSent }) {
  const [text, setText] = useState("");
  const send = async () => {
    const msg = { sender_id: user.id, sender_name: user.full_name, message: text.trim(), timestamp: new Date().toISOString() };
    await base44.entities.FoodRequest.update(request.id, { messages: [...(request.messages || []), msg] });
    setText("");
    onSent();
  };
  return (
    <div className="space-y-2 pt-2">
      {(request.messages || []).map((m, i) => (
        <p key={i} className="text-base"><span className="font-bold text-secondary">{m.sender_id === user.id ? "you" : m.sender_name}:</span> {m.message}</p>
      ))}
      <div className="flex gap-2">
        <Input className="h-12 text-base" placeholder="message…" value={text} onChange={(e) => setText(e.target.value)} />
        <Button className="h-12" disabled={!text.trim()} onClick={send}>send</Button>
      </div>
    </div>
  );
}