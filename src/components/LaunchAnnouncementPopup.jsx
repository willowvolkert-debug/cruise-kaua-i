import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LaunchAnnouncementPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dismissed = sessionStorage.getItem("launch_popup_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("launch_popup_dismissed", "1");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await base44.entities.LaunchSignup.create({ email, name: name || undefined });
      setSubmitted(true);
      setTimeout(() => handleDismiss(), 4000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="bg-gradient-to-br from-primary to-secondary p-8 text-center">
              <img
                src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
                alt="Cruise Kauaʻi"
                className="w-16 h-16 rounded-2xl mx-auto mb-3 border-2 border-white/30 object-cover"
              />
              <h2 className="text-white text-2xl font-bold">We're Pausing — And Leveling Up</h2>
            </div>

            <div className="p-6">
              {submitted ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-secondary mb-2">You're In! 🌺</h3>
                  <p className="text-gray-600 text-sm">
                    Thanks for staying connected. We'll keep you updated on the Cruise Hawaiʻi App launch and how you can participate.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    We're pausing this platform to prepare for something bigger. The <strong>Cruise Hawaiʻi App</strong> launches by <strong>November 1st</strong> — bringing community ridesharing to all the islands with new features and disaster relief capabilities.
                  </p>
                  <p className="text-gray-600 text-sm mb-5">
                    Enter your email to stay up to date on developments and how to participate.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name (optional)"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email address"
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      />
                    </div>
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Signing up..." : "Keep Me Updated"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}