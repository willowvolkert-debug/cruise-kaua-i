import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function OwnerInfo({ post }) {
  const initials = (post.owner_name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar className="h-12 w-12 bg-gradient-to-r from-primary to-secondary shrink-0">
        <AvatarImage src={post.owner_profile_picture_url} />
        <AvatarFallback className="text-white font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="font-bold text-foreground leading-tight truncate">{post.owner_name}</p>
        {post.owner_username && <p className="text-xs text-muted-foreground truncate">@{post.owner_username}</p>}
        {(post.owner_age || post.owner_gender) && (
          <p className="text-xs text-muted-foreground">{[post.owner_age, post.owner_gender].filter(Boolean).join(" · ")}</p>
        )}
        {post.owner_bio && <p className="text-xs text-muted-foreground line-clamp-2">{post.owner_bio}</p>}
      </div>
    </div>
  );
}