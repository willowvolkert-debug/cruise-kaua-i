import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("instagram");

    // Get the connected Instagram Business account id + username
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
    );
    const me = await meRes.json();
    if (!me.id) {
      return Response.json({ error: "Unable to resolve Instagram account", detail: me }, { status: 502 });
    }

    // Fetch recent media (images + videos)
    const mediaRes = await fetch(
      `https://graph.instagram.com/v21.0/${me.id}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=12&access_token=${accessToken}`
    );
    const media = await mediaRes.json();

    const posts = (media.data || []).map((p) => ({
      id: p.id,
      caption: p.caption || "",
      media_type: p.media_type, // IMAGE, VIDEO, CAROUSEL_ALBUM
      media_url: p.media_type === "VIDEO" ? (p.thumbnail_url || p.media_url) : p.media_url,
      permalink: p.permalink,
      timestamp: p.timestamp,
    }));

    return Response.json({ username: me.username, posts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});