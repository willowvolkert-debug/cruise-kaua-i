import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Paperclip, X } from "lucide-react";
import { flowField, flowTextarea, flowLabel, flowButton } from "@/components/trips/flowStyles";
import { submitContactInquiry } from "@/functions/submitContactInquiry";

export default function ContactUsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
        setFormData(prev => ({ ...prev, name: user.full_name || '', email: user.email || '' }));
      } catch (error) {
        // Not logged in — fine, allow guest submission
      }
    };
    loadUser();
  }, []);

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (!formData.subject?.trim() || !formData.message?.trim()) {
      alert("Please fill in both the subject and message fields.");
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

      await submitContactInquiry({
        user_name: currentUser?.full_name || formData.name || 'Guest',
        user_email: currentUser?.email || formData.email || 'guest@unknown.com',
        subject: formData.subject,
        message: messageWithScreenshots,
        priority: formData.priority
      });

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '', priority: 'medium' });
      setScreenshots([]);

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      const errMsg = error?.response?.data?.message || error?.message || "Unknown error";
      alert(`Error submitting inquiry: ${errMsg}. Please try again.`);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8 bg-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="cruise-head tracking-widest text-4xl text-secondary leading-none">contact us</h1>
          <p className="text-gray-900 text-lg mt-1">we're here to help! send us a message</p>
          <p className="text-base text-gray-500 mt-2">
            Form not working? Email us at{" "}
            <a href="mailto:cruisekauai@gmail.com" className="text-primary underline font-medium">cruisekauai@gmail.com</a>
            {" "}or text at{" "}
            <a href="sms:8087209854" className="text-primary underline font-medium">808-720-9854</a>
          </p>
        </div>

        {submitted ? (
          <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
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
          <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
            <CardHeader className="px-0">
              <CardTitle className="cruise-head tracking-widest text-3xl text-secondary">send us a message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                {!currentUser && (
                  <>
                    <div className="space-y-2">
                      <Label className={flowLabel} htmlFor="name">your name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Your full name"
                        className={flowField}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={flowLabel} htmlFor="email">your email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="you@example.com"
                        className={flowField}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label className={flowLabel} htmlFor="subject">subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="What can we help you with?"
                    required
                    className={flowField}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={flowLabel} htmlFor="priority">priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({...formData, priority: value})}
                  >
                    <SelectTrigger className={flowField}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">low</SelectItem>
                      <SelectItem value="medium">medium</SelectItem>
                      <SelectItem value="high">high</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={flowLabel} htmlFor="message">message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Tell us more about your inquiry..."
                    className={flowTextarea}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>screenshots / files (optional)</Label>
                  <p className="text-xs text-gray-500">Attach screenshots or documents (images, PDF, Word, Excel).</p>
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg px-4 py-4 text-lg">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">attach files</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
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
                          <button type="button" onClick={() => setScreenshots(prev => prev.filter((_, idx) => idx !== i))}>
                            <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading || !formData.subject?.trim() || !formData.message?.trim()}
                  className={flowButton}
                >
                  {isUploading ? 'uploading screenshots...' : isSubmitting ? 'sending...' : 'send message'}
                </Button>
              </form>
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