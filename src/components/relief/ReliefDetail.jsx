import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import OwnerInfo from "@/components/relief/OwnerInfo";
import ReliefThread from "@/components/relief/ReliefThread";

export default function ReliefDetail({ post, user, onClose, onRemoved }) {
  const [thread, setThread] = useState(null);
  const [convos, setConvos] = useState([]);
  const isOwner = user && user.id === post.owner_id;

  useEffect(() => {
    if (!isOwner) return;
    base44.entities.ReliefMessage.filter({ post_id: post.id }, { limit: 200 }).then((res) => {
      const map = {};
      res.items.forEach((m) => { if (m.sender_id !== user.id) map[m.sender_id] = m.sender_name; });
      setConvos(Object.entries(map));
    });
  }, [post.id]);

  const remove = async () => {
    await base44.entities.ReliefPost.delete(post.id);
    onRemoved();
  };

  const message = () => (user ? setThread({ id: post.owner_id, name: post.owner_name }) : base44.auth.redirectToLogin(window.location.href));

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={post.kind === "need" ? "text-red-600" : "text-blue-600"}>{post.title}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">{post.kind} · {post.location_text}</p>
          <div className="flex items-center justify-between gap-3">
            <OwnerInfo post={post} />
            {!isOwner && (
              <Button onClick={message} className="bg-green-600 hover:bg-green-700 text-white shrink-0">message</Button>
            )}
          </div>
          {post.details && <p className="text-sm text-foreground whitespace-pre-wrap">{post.details}</p>}
          {isOwner && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-sm font-semibold">messages to you</p>
              {convos.length === 0 && <p className="text-xs text-muted-foreground">no messages yet</p>}
              {convos.map(([id, name]) => (
                <Button key={id} variant="outline" className="w-full justify-start" onClick={() => setThread({ id, name })}>{name}</Button>
              ))}
              <Button variant="outline" onClick={remove} className="w-full text-red-600 border-red-600">take this down</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {thread && <ReliefThread post={post} user={user} otherId={thread.id} otherName={thread.name} onClose={() => setThread(null)} />}
    </>
  );
}