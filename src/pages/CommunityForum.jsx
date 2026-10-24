import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MessageCircle, Camera, X, Send, Clock } from "lucide-react";
import { format } from "date-fns";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function CommunityForum() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingPost, setHasPendingPost] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const allPosts = await base44.entities.CommunityPost.list();
      const approvedPosts = allPosts.filter(p => p.status === 'approved').sort((a, b) =>
        new Date(b.created_date) - new Date(a.created_date)
      );
      setPosts(approvedPosts);

      const userPendingPost = allPosts.find(p => p.user_id === user.id && p.status === 'pending');
      setHasPendingPost(!!userPendingPost);
    } catch (e) {
      console.error("Error loading data:", e);
    }
    setIsLoading(false);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 4) {
      alert("Maximum 4 images allowed");
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
  };

  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!newPostContent.trim()) {
      alert("Please write something before posting");
      return;
    }

    setIsSubmitting(true);
    try {
      const imageUrls = [];
      for (const file of selectedImages) {
        const result = await base44.integrations.Core.UploadFile({ file });
        imageUrls.push(result.file_url);
      }

      await base44.entities.CommunityPost.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_username: currentUser.username,
        user_profile_picture: currentUser.profile_picture_url,
        content: newPostContent,
        image_urls: imageUrls,
        status: 'pending'
      });

      await base44.entities.AdminMessage.create({
        recipient_id: 'admin',
        recipient_name: 'Admin',
        subject: `New Community Post from ${currentUser.full_name}`,
        message: `A user has submitted a new community post for review.\n\nUser: ${currentUser.full_name} (@${currentUser.username})\n\nContent: ${newPostContent.substring(0, 100)}...\n\nPlease review in the Admin Dashboard.`,
        message_type: 'action_required'
      });

      alert("Your post has been submitted for review! You'll be notified when it's approved.");
      setNewPostContent("");
      setSelectedImages([]);
      setHasPendingPost(true);
    } catch (error) {
      console.error("Error submitting post:", error);
      alert("Error submitting post. Please try again.");
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="p-8 text-center"><p className="text-gray-500">Loading forum...</p></div>;
  }

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/community" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" /> back to community
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-secondary">forum</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            this is a forum space to share business &amp; community updates, provide feedback, and share in transparent conversation about building a platform to empower community
          </p>
          <p className="text-sm text-primary font-medium max-w-xl mx-auto mt-4 p-3 bg-green-50 rounded-2xl border border-green-200">
            🌺 This is a safe space for riders to share when they're taking a ride through the app and when they've made it to their destination safely.
          </p>
        </div>

        {currentUser && (
          <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={currentUser.profile_picture_url} />
                  <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-semibold">
                    {getInitials(currentUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Share your Cruise Kauaʻi story..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-24 rounded-2xl border-gray-300 resize-none"
                    disabled={hasPendingPost}
                  />

                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                          <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                          <button onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className={`cursor-pointer ${hasPendingPost ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" disabled={hasPendingPost} />
                      <div className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
                        <Camera className="w-5 h-5" />
                        <span className="text-sm">Add photos</span>
                      </div>
                    </label>

                    <Button onClick={handleSubmit} disabled={isSubmitting || !newPostContent.trim() || hasPendingPost} className="bg-primary hover:bg-primary/90 rounded-2xl">
                      {isSubmitting ? "Submitting..." : (<><Send className="w-4 h-4 mr-2" />Submit for Review</>)}
                    </Button>
                  </div>

                  {hasPendingPost && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-800 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>You have a post pending review. You can submit another once it's been reviewed.</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No posts yet. Be the first to share your story!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map(post => (
              <Card key={post.id} className="shadow-md border-gray-200 bg-white rounded-3xl overflow-hidden">
                <CardHeader className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={post.user_profile_picture} />
                      <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-semibold">
                        {getInitials(post.user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-secondary">@{post.user_username || post.user_name}</p>
                      <p className="text-xs text-gray-500">{format(new Date(post.created_date), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className={`grid gap-2 ${post.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {post.image_urls.map((url, index) => (
                        <div key={index} className="rounded-2xl overflow-hidden bg-gray-100">
                          <img src={url} alt={`Post image ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}