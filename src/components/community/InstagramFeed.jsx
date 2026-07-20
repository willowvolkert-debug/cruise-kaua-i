import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, ExternalLink, Loader2 } from "lucide-react";
import { getInstagramPosts } from "@/functions/getInstagramPosts";

export default function InstagramFeed() {
  const [posts, setPosts] = useState([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getInstagramPosts({});
        if (!active) return;
        setPosts(res.data?.posts || []);
        setUsername(res.data?.username || "");
      } catch (e) {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">loading our latest posts…</span>
      </div>
    );
  }

  if (error || posts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Instagram className="w-5 h-5 text-secondary" />
        <h2 className="text-lg font-bold text-secondary">from our instagram</h2>
        {username && (
          <a
            href={`https://www.instagram.com/${username}/`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-500 hover:text-primary ml-auto flex items-center gap-1"
          >
            @{username} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noreferrer"
            className="group block"
          >
            <Card className="overflow-hidden border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={post.media_url}
                  alt={post.caption?.slice(0, 80) || "Instagram post"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              {post.caption && (
                <CardContent className="p-3">
                  <p className="text-xs text-gray-600 leading-snug line-clamp-3">
                    {post.caption}
                  </p>
                </CardContent>
              )}
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}