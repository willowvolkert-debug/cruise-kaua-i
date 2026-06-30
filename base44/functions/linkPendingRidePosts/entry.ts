import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Maps admin-posted rider names to the email that should claim them
const PENDING_CLAIMS = {
  "jessica klimek": "klimek.ads@gmail.com"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Check if there are any admin-posted ride requests to claim
    const allPosts = await base44.asServiceRole.entities.RidePost.filter({ rider_id: "admin_posted" });
    if (allPosts.length === 0) {
      return Response.json({ skipped: true, reason: "no pending posts" });
    }

    const userEmail = (user.email || "").toLowerCase();
    const userName = (user.full_name || "").toLowerCase();

    const updates = [];
    for (const post of allPosts) {
      const postName = (post.rider_name || "").toLowerCase();
      const claimEmail = PENDING_CLAIMS[postName];
      
      // Match if user email matches the claim email, or user name matches the rider name
      if ((claimEmail && userEmail === claimEmail) || userName === postName) {
        const updateData = { rider_id: user.id };
        if (user.full_name) updateData.rider_name = user.full_name;
        if (user.username) updateData.rider_username = user.username;
        if (user.profile_picture_url) updateData.rider_profile_picture_url = user.profile_picture_url;
        if (user.bio) updateData.rider_bio = user.bio;
        if (user.age) updateData.rider_age = user.age;
        if (user.gender) updateData.rider_gender = user.gender;

        await base44.asServiceRole.entities.RidePost.update(post.id, updateData);
        updates.push(post.id);
      }
    }

    return Response.json({ linked: updates.length > 0, updated_posts: updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});