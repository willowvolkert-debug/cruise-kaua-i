import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Paperclip, X } from "lucide-react";

export default function ContactUsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    if (!currentUser) {
      alert("Please log in to submit an inquiry.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload screenshots first
      let screenshotUrls = [];
      if (screenshots.length > 0) {
        setIsUploading(true);
        screenshotUrls = await Promise.all(
          screenshots.map(async (file) => {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            return file_url;
          })
        );
        setIsUploading(false);
      }

      const messageWithScreenshots = screenshotUrls.length > 0
        ? `${formData.message}\n\n[Screenshots attached: ${screenshotUrls.join(', ')}]`
        : formData.message;

      await base44.entities.ContactInquiry.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_email: currentUser.email,
        subject: formData.subject,
        message: messageWithScreenshots,
        priority: formData.priority,
        status: 'pending'
      });

      setSubmitted(true);
      setFormData({ subject: '', message: '', priority: 'medium' });
      setScreenshots([]);

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      alert("Error submitting inquiry. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8 bg-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">contact us</h1>
          <p className="text-gray-600">we're here to help! send us a message</p>
        </div>

        {submitted ? (
          <Card className="shadow-lg border-gray-200 bg-white rounded-3xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-secondary mb-2">message sent!</h2>
              <p className="text-gray-600">
                We've received your inquiry and will get back to you soon.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-gray-200 bg-white rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl text-secondary">send us a message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject">subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="What can we help you with?"
                  required
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="low">low</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="high">high</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Tell us more about your inquiry..."
                  className="h-32 rounded-2xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>screenshots (optional)</Label>
                <p className="text-xs text-gray-500">Attach screenshots if you're reporting a technical issue.</p>
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-2xl px-4 py-3 hover:bg-gray-50 transition-colors">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">attach screenshots</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setScreenshots(prev => [...prev, ...files].slice(0, 5));
                    }}
                  />
                </label>
                {screenshots.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {screenshots.map((file, i) => (
                      <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600">
                        <span className="truncate max-w-32">{file.name}</span>
                        <button onClick={() => setScreenshots(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
                className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
              >
                {isUploading ? 'uploading screenshots...' : isSubmitting ? 'sending...' : 'send message'}
              </Button>
            </CardContent>
          </Card>
        )}

        <footer className="pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Cruise Hawaiʻi. Specializing in carpooling and ridesharing across Hawaiʻi.
        </footer>
      </div>
    </div>
  );
}