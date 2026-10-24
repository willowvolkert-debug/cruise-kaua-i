import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("email");
    if (prefill) setEmail(prefill);
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!email) {
      setError("please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
      setSent(true);
    } catch (e) {
      setError("couldn't send reset link. please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <a href="/join?login=true" className="flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
            alt="Cruise Kauaʻi"
            className="w-9 h-9 rounded-xl object-cover"
          />
        </a>
        <a
          href="/join?login=true"
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2"
        >
          back to login
        </a>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">reset password</h1>

        {sent ? (
          <div className="mt-6 bg-primary/10 border border-primary/20 rounded-xl px-4 py-4">
            <p className="text-sm text-primary font-medium mb-2">check your inbox 📬</p>
            <p className="text-sm text-gray-600">
              if an account exists for <span className="font-semibold">{email}</span>, we've sent a link to reset your password. click the link in that email to set a new password.
            </p>
            <a
              href="/join?login=true"
              className="inline-block mt-4 text-sm text-primary underline font-semibold hover:text-primary/80"
            >
              ← back to login
            </a>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-base mb-6">
              enter your email and we'll send you a link to set a new password.
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-xl h-12"
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-xl h-12 text-base font-bold"
              >
                {loading ? "sending..." : "send reset link"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}